"""
SIH GeM Bid Compliance Platform (PS ID: 26100)
services/verification/cert_verifier.py
---------------------------------------------------------
Step 3 (part 2) - Certificate Validity & Expiry Engine.

Takes ONE extracted bid record (the dict `extractor.extract_bid()`
returns) plus the tender's requirements, and cross-checks the bidder's
self-declared certificates (BIS, ISO 9001, NSIC) against the verified
government/certification-body records in mock_portals.py.

This module answers ONE question: "are this bidder's certificates
genuine, currently valid, and sufficient to satisfy this tender's
mandatory certification list?" It deliberately does NOT verify the
bidder's identity (GSTIN/PAN/CIN/name) or Udyam/Startup India status -
that's vendor_verifier.py - or tender-specific numeric thresholds like
turnover/local content - that's tender_verifier.py. Keeping those
separate means each file has one reason to change.

Field-naming assumption (mirrors vendor_verifier.py's convention for
Step 2's extractor output): a declared certificate number is expected
at fields["<prefix>_certificate_number"], e.g. fields["bis_certificate_number"],
fields["iso_9001_certificate_number"], fields["nsic_certificate_number"].
If Step 2 ships different field names, update CERT_REGISTRY's
"field_prefix" values - nothing else in this file needs to change.
"""

from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any, Optional

from services.verification import mock_portals as mp

# ---------------------------------------------------------
# Severity levels
# ---------------------------------------------------------
# Same vocabulary as vendor_verifier.py so a downstream aggregator
# (scorer.py) can merge both engines' check lists without a translation
# layer.
#
# CRITICAL - identity itself is in question (handled upstream by
#            vendor_verifier.py; only reused here for "vendor not found"
#            since certificates can't be checked without a vendor).
# FAIL     - a mandatory certification is missing, expired, or its
#            declared number doesn't match the registry.
# WARNING  - a self-declared claim or portal field the data can't fully
#            confirm (missing extraction, unparseable date, portal
#            fields disagreeing with each other).
# INFO     - informational only; a non-mandatory certification issue
#            that does not affect eligibility for this tender.
# PASS     - check performed and satisfied.

CRITICAL = "CRITICAL"
FAIL = "FAIL"
WARNING = "WARNING"
PASS = "PASS"
INFO = "INFO"

# Dates in dummy_records.json are written DD/MM/YYYY, e.g. "14/01/2028".
DATE_FORMAT = "%d/%m/%Y"

# Portal certificate_status values that count as "currently valid".
# Deliberately narrow: "Revoked" and anything else falls through to the
# "not confirmed valid" path rather than being assumed fine.
_VALID_STATUS_VALUES = {"valid", "active"}

# Single source of truth mapping a canonical certificate key to:
#   - labels: how the tender's mandatory_certifications list may spell it
#   - display_name: human-readable name used in check messages
#   - section/subsection: where to find the record on a vendor dict
#     (BIS and ISO 9001 live nested under vendor["certifications"][...],
#     NSIC lives at the top level as vendor["nsic"] - see mock_portals.py)
#   - field_prefix: the extracted-bid field name prefix for this cert
# Adding a new certificate type is one new entry here, not a new
# if/elif branch scattered through the file.
CERT_REGISTRY: dict[str, dict[str, Any]] = {
    "bis": {
        "labels": {"BIS", "BIS CERTIFICATION", "BIS CERTIFICATE"},
        "display_name": "BIS Certification",
        "section": "certifications",
        "subsection": "bis",
        "field_prefix": "bis",
    },
    "iso_9001": {
        "labels": {"ISO-9001", "ISO 9001", "ISO9001", "ISO 9001:2015"},
        "display_name": "ISO 9001 Certification",
        "section": "certifications",
        "subsection": "iso_9001",
        "field_prefix": "iso_9001",
    },
    "nsic": {
        "labels": {"NSIC", "NSIC CERTIFICATE", "NSIC REGISTRATION"},
        "display_name": "NSIC Certificate",
        "section": None,  # lives directly at vendor["nsic"], not nested
        "subsection": "nsic",
        "field_prefix": "nsic",
    },
}


# ---------------------------------------------------------
# Small shared helpers
# ---------------------------------------------------------

def _normalize_id(value: Optional[str]) -> str:
    """Strip + uppercase for identifier comparisons. Certificate numbers
    on the bid come from OCR/PDF extraction (a different pipeline than
    the portal registry), so a real match can differ from the registry
    value only by case or incidental whitespace - comparing raw strings
    would misreport that as a fabricated/mismatched certificate."""
    if not value or not isinstance(value, str):
        return ""
    return value.strip().upper()


def _make_check(name: str, status: str, declared: Any, expected: Any, message: str) -> dict:
    return {
        "check": name,
        "status": status,
        "declared": declared,
        "expected": expected,
        "message": message,
    }


def _parse_date(value: Optional[str]) -> Optional[date]:
    """Parse a DD/MM/YYYY date as used throughout dummy_records.json.
    Returns None (never raises) for missing or malformed input, so one
    bad date degrades that specific check to 'cannot verify' instead of
    crashing verification for the whole bid."""
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.strptime(value.strip(), DATE_FORMAT).date()
    except ValueError:
        return None


def _is_expired(valid_upto: Optional[str], as_of: date) -> Optional[bool]:
    """True/False based on the actual valid_upto date, or None if the
    date couldn't be parsed. This is computed independently of the
    portal's own certificate_status string on purpose: dummy_records.json
    includes a "Revoked" status on one vendor whose valid_upto date has
    ALSO already passed, and other datasets may have a status field that
    simply wasn't updated - trusting the label alone would miss that."""
    parsed = _parse_date(valid_upto)
    if parsed is None:
        return None
    return parsed < as_of


def _get_portal_cert_record(vendor: dict, cert_key: str) -> dict:
    config = CERT_REGISTRY[cert_key]
    if config["section"]:
        return vendor.get(config["section"], {}).get(config["subsection"], {}) or {}
    return vendor.get(config["subsection"], {}) or {}


def _normalize_cert_label(label: Any) -> Optional[str]:
    """Map a free-text certification label from tender_requirements
    (e.g. 'ISO-9001', 'iso 9001', 'BIS') to this module's canonical
    certificate key. Returns None for an unrecognized label rather than
    raising - an unrecognized mandatory certification is something a
    procurement officer needs to see flagged, not something that should
    silently vanish or crash the run."""
    if not isinstance(label, str):
        return None
    cleaned = label.strip().upper()
    for cert_key, config in CERT_REGISTRY.items():
        if cleaned in config["labels"]:
            return cert_key
    return None


def _resolve_mandatory_cert_keys(tender_requirements: dict) -> tuple[set[str], list[str]]:
    """Returns (recognized canonical keys, unrecognized raw labels)."""
    raw_labels = tender_requirements.get("mandatory_certifications") or []
    recognized: set[str] = set()
    unrecognized: list[str] = []
    for label in raw_labels:
        key = _normalize_cert_label(label)
        if key:
            recognized.add(key)
        else:
            unrecognized.append(str(label))
    return recognized, unrecognized


# ---------------------------------------------------------
# Per-certificate check
# ---------------------------------------------------------

def _check_single_certificate(
    cert_key: str, fields: dict, vendor: dict, mandatory: bool, as_of: date
) -> list[dict]:
    config = CERT_REGISTRY[cert_key]
    display = config["display_name"]
    portal_cert = _get_portal_cert_record(vendor, cert_key)
    declared_number = fields.get(f"{config['field_prefix']}_certificate_number")
    portal_number = portal_cert.get("certificate_number")
    portal_status = portal_cert.get("certificate_status")
    portal_valid_upto = portal_cert.get("valid_upto")

    # 1. Does the portal have any record of this certificate at all?
    if not portal_cert or not portal_number:
        status = FAIL if mandatory else INFO
        checks = [_make_check(
            f"{cert_key}_certificate_on_file", status, declared_number, None,
            (f"{display} is required by this tender but no certificate record exists for this "
             "vendor in portal data.")
            if mandatory else
            f"No {display} record exists for this vendor in portal data (not required by this tender)."
        )]
        return checks

    checks: list[dict] = []

    # 2. Declared certificate number vs registry - is this the SAME certificate?
    if not declared_number:
        checks.append(_make_check(
            f"{cert_key}_declared_on_bid", WARNING, declared_number, portal_number,
            f"{display} number could not be extracted from the bid document - could not cross-verify "
            "against the portal record."
        ))
    else:
        matched = _normalize_id(declared_number) == _normalize_id(portal_number)
        checks.append(_make_check(
            f"{cert_key}_number_matches_registry", PASS if matched else FAIL,
            declared_number, portal_number,
            f"{display} number on the bid matches the portal record."
            if matched else
            f"{display} number on the bid does not match the portal record - review before accepting."
        ))

    # 3. Expiry - checked against the actual date, with the status label
    #    used only as a secondary consistency check (see _is_expired).
    expired = _is_expired(portal_valid_upto, as_of)
    status_says_valid = isinstance(portal_status, str) and portal_status.strip().lower() in _VALID_STATUS_VALUES

    if expired is None:
        checks.append(_make_check(
            f"{cert_key}_not_expired", WARNING, portal_status, portal_valid_upto,
            f"{display}'s valid_upto date is missing or unparseable in portal data - expiry could not "
            "be independently confirmed."
        ))
    elif expired:
        severity = FAIL if mandatory else WARNING
        checks.append(_make_check(
            f"{cert_key}_not_expired", severity, portal_valid_upto, as_of.strftime(DATE_FORMAT),
            f"{display} expired on {portal_valid_upto} (as of {as_of.strftime(DATE_FORMAT)})."
            + (" This is a mandatory certification for this tender." if mandatory else "")
        ))
    elif not status_says_valid:
        # Not expired by date, but the portal's own status disagrees -
        # a real inconsistency worth a human look regardless of mandatory-ness.
        checks.append(_make_check(
            f"{cert_key}_not_expired", WARNING, portal_status, "Valid",
            f"{display}'s valid_upto date has not passed, but the portal's certificate_status is "
            f"'{portal_status}', not 'Valid' - inconsistent portal record, worth a manual check."
        ))
    else:
        checks.append(_make_check(
            f"{cert_key}_not_expired", PASS, portal_status, "Valid",
            f"{display} is currently valid (not expired, status confirmed Valid)."
        ))

    return checks


# ---------------------------------------------------------
# Public API
# ---------------------------------------------------------

def verify_certificates(
    extracted_bid: dict,
    tender_requirements: Optional[dict] = None,
    as_of: Optional[date] = None,
) -> dict:
    """extracted_bid is one element of extractor.extract_all_bids()'s
    return value (i.e. has 'source_file', 'extraction_issues', 'fields').

    tender_requirements defaults to mock_portals' own tender_requirements
    record when not supplied, so this can be called standalone the same
    way vendor_verifier.verify_vendor() can.

    as_of defaults to today and exists so callers (and tests) aren't at
    the mercy of the wall clock changing which certificates read as
    expired between runs."""
    fields = extracted_bid.get("fields", {})
    gstin = fields.get("gstin")
    source_file = extracted_bid.get("source_file", "<unknown>")
    reference_date = as_of or datetime.now().date()

    if tender_requirements is None:
        tender_requirements = mp.get_tender_requirements()

    if not gstin:
        return {
            "source_file": source_file,
            "gstin": None,
            "vendor_found_in_registry": False,
            "overall_status": CRITICAL,
            "checks": [_make_check(
                "vendor_lookup", CRITICAL, None, None,
                "No GSTIN could be extracted from this bid - certificates cannot be verified without "
                "first resolving the vendor."
            )],
        }

    vendor = mp.get_vendor_by_gstin(gstin)
    if not vendor:
        return {
            "source_file": source_file,
            "gstin": gstin,
            "vendor_found_in_registry": False,
            "overall_status": CRITICAL,
            "checks": [_make_check(
                "vendor_lookup", CRITICAL, gstin, None,
                f"GSTIN '{gstin}' has no matching record in the government portal registry - "
                "certificates cannot be verified."
            )],
        }

    mandatory_keys, unrecognized_labels = _resolve_mandatory_cert_keys(tender_requirements)

    checks: list[dict] = [_make_check(
        "vendor_lookup", PASS, gstin, gstin,
        "GSTIN found in government portal registry."
    )]

    for label in unrecognized_labels:
        checks.append(_make_check(
            "mandatory_certification_recognized", WARNING, label, sorted(CERT_REGISTRY.keys()),
            f"Tender lists '{label}' as a mandatory certification, but this is not a certification "
            "type this engine currently recognizes - verify it manually."
        ))

    for cert_key in CERT_REGISTRY:
        is_mandatory = cert_key in mandatory_keys
        checks.extend(_check_single_certificate(cert_key, fields, vendor, is_mandatory, reference_date))

    severities = {c["status"] for c in checks}
    if CRITICAL in severities:
        overall = CRITICAL
    elif FAIL in severities:
        overall = FAIL
    elif WARNING in severities:
        overall = WARNING
    else:
        overall = PASS

    return {
        "source_file": source_file,
        "gstin": gstin,
        "vendor_found_in_registry": True,
        "mandatory_certifications": sorted(mandatory_keys),
        "overall_status": overall,
        "checks": checks,
    }


def verify_all(extracted_bids: list[dict], tender_requirements: Optional[dict] = None) -> list[dict]:
    if tender_requirements is None:
        tender_requirements = mp.get_tender_requirements()
    return [verify_certificates(bid, tender_requirements=tender_requirements) for bid in extracted_bids]


# ---------------------------------------------------------
# CLI - runs against services/ai/extractor.py's output
# ---------------------------------------------------------

def main() -> None:
    from services.ai import extractor as ext

    extracted = ext.extract_all_bids()
    tender_requirements = mp.get_tender_requirements()
    results = verify_all(extracted, tender_requirements=tender_requirements)

    for r in results:
        flagged = [c for c in r["checks"] if c["status"] != PASS]
        print(f"{r['source_file']:35s} overall={r['overall_status']:10s} flagged_checks={len(flagged)}")
        for c in flagged:
            print(f"    [{c['status']}] {c['check']}: {c['message']}")

    out_path = ext.PROJECT_ROOT / "cert_verification_results.json"
    out_path.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {out_path}")


if __name__ == "__main__":
    main()