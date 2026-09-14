"""services/verification/vendor_verifier.py

Vendor Identity & Mismatch Engine (improved)

- Robust package/import handling (works as package or when executed directly).
- Normalizes GSTIN before lookup.
- Softens missing-identity declarations to WARNING vs CRITICAL where appropriate.
- Adds numeric 'score', 'risk_level', and 'confidence' fields to the result.
- Preserves original check structure for backward compatibility.
"""

from __future__ import annotations

import json
import re
import sys
import logging
from pathlib import Path
from typing import Any, Optional, List, Dict

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

# Robust import: prefer relative import when used as a package; fall back to sys.path
try:
    # When used as part of the package
    from . import mock_portals as mp
except Exception:
    try:
        # Try absolute import (when executed as top-level package)
        from services.verification import mock_portals as mp
    except Exception:
        # Last resort: patch sys.path so the project root is available (allows direct execution)
        sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
        from services.verification import mock_portals as mp


# Severity constants
CRITICAL = "CRITICAL"
FAIL = "FAIL"
WARNING = "WARNING"
PASS = "PASS"
INFO = "INFO"


# Name matching helper
_SUFFIX_EXPANSIONS = {
    "PVT": "PRIVATE",
    "LTD": "LIMITED",
    "CO": "COMPANY",
    "INC": "INCORPORATED",
    "CORP": "CORPORATION",
    "LLP": "LIMITED LIABILITY PARTNERSHIP",
}


def _normalize_name(name: Optional[str]) -> str:
    if not name:
        return ""
    cleaned = name.strip().upper()
    cleaned = re.sub(r"[^\w\s]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    tokens = cleaned.split(" ") if cleaned else []
    expanded = [_SUFFIX_EXPANSIONS.get(tok, tok) for tok in tokens]
    return " ".join(expanded)


def _names_match(declared: Optional[str], official: Optional[str]) -> bool:
    d, o = _normalize_name(declared), _normalize_name(official)
    if not d or not o:
        return False
    return d == o or d in o or o in d


def _make_check(name: str, status: str, declared: Any, expected: Any, message: str) -> dict:
    return {
        "check": name,
        "status": status,
        "declared": declared,
        "expected": expected,
        "message": message,
    }


# Individual checks

def _check_identity_numbers(fields: dict, vendor: dict) -> List[dict]:
    checks: List[dict] = []

    pan_declared = mp.normalize(fields.get("pan"))
    pan_official = mp.normalize(vendor.get("pan_it", {}).get("pan"))
    if pan_declared:
        pan_status = PASS if pan_declared == pan_official else CRITICAL
        pan_message = (
            "PAN on bid matches PAN registered against this GSTIN." if pan_status == PASS else
            "PAN declared on the bid does not match the PAN on record for this GSTIN - possible identity mismatch."
        )
    elif pan_official:
        # Bidder omitted PAN but the registry has one on file for this GSTIN -
        # a real gap worth a manual look.
        pan_status = WARNING
        pan_message = "PAN was not declared on the bid; registry has PAN on record — manual review recommended."
    else:
        # Neither side has a PAN - nothing to cross-check, so this isn't a
        # finding against the bidder specifically.
        pan_status = INFO
        pan_message = "PAN was not declared on the bid, and no PAN is on record in the registry either - nothing to cross-check."
    checks.append(_make_check(
        "pan_matches_registry",
        pan_status,
        fields.get("pan"),
        vendor.get("pan_it", {}).get("pan"),
        pan_message,
    ))

    cin_declared = mp.normalize(fields.get("cin"))
    cin_official = mp.normalize(vendor.get("mca21", {}).get("cin"))
    if cin_declared:
        cin_status = PASS if cin_declared == cin_official else CRITICAL
        cin_message = (
            "CIN on bid matches CIN registered against this GSTIN." if cin_status == PASS else
            "CIN declared on the bid does not match the CIN on record for this GSTIN - possible identity mismatch."
        )
    elif cin_official:
        cin_status = WARNING
        cin_message = "CIN was not declared on the bid; registry has CIN on record — manual review recommended."
    else:
        cin_status = INFO
        cin_message = "CIN was not declared on the bid, and no CIN is on record in the registry either - nothing to cross-check."
    checks.append(_make_check(
        "cin_matches_registry",
        cin_status,
        fields.get("cin"),
        vendor.get("mca21", {}).get("cin"),
        cin_message,
    ))

    return checks


def _check_names(fields: dict, vendor: dict) -> List[dict]:
    checks: List[dict] = []
    declared_name = fields.get("legal_name")

    for source_key, source_label in (
        ("gstn", "GST legal_name"),
        ("pan_it", "PAN name_on_pan"),
        ("mca21", "MCA company_name"),
    ):
        section = vendor.get(source_key, {})
        official_name = section.get("legal_name") or section.get("name_on_pan") or section.get("company_name")
        matched = _names_match(declared_name, official_name)
        checks.append(_make_check(
            f"name_matches_{source_key}",
            PASS if matched else FAIL,
            declared_name, official_name,
            f"Bid's declared legal name matches {source_label}."
            if matched else
            f"Bid's declared legal name does not match {source_label} - review before accepting."
        ))
    return checks


def _check_registration_and_debarment(vendor: dict) -> List[dict]:
    checks: List[dict] = []

    gst_status = vendor.get("gstn", {}).get("registration_status")
    checks.append(_make_check(
        "gst_registration_active",
        PASS if gst_status == "Active" else FAIL,
        gst_status, "Active",
        "GST registration is Active."
        if gst_status == "Active" else
        f"GST registration status is '{gst_status}', not Active - bidder may be ineligible."
    ))

    debarment_status = vendor.get("debarment_registry", {}).get("registry_status", "")
    is_clear = "no adverse record" in (debarment_status or "").lower()
    checks.append(_make_check(
        "not_debarred",
        PASS if is_clear else CRITICAL,
        debarment_status, "No adverse record located",
        "No blacklisting/debarment record found."
        if is_clear else
        f"Debarment registry shows: '{debarment_status}' - this bidder may be disqualified outright."
    ))

    return checks


def _is_actually_udyam_registered(portal_udyam: Optional[dict]) -> bool:
    if not portal_udyam:
        return False
    return bool(portal_udyam.get("udyam_registration_number")) and portal_udyam.get("registration_status") == "Active"


def _check_udyam_claim(fields: dict, gstin: str) -> List[dict]:
    checks: List[dict] = []
    declared_registered = (fields.get("udyam_msme_registered") or "").strip().lower()
    declared_number = fields.get("udyam_registration_number")
    portal_udyam = mp.query_udyam_portal(gstin)
    actually_registered = _is_actually_udyam_registered(portal_udyam)

    if declared_registered == "yes":
        if not actually_registered:
            checks.append(_make_check(
                "udyam_claim_verifiable", FAIL, declared_number,
                (portal_udyam or {}).get("registration_status"),
                "Bidder claims active Udyam/MSME registration but the portal record shows it is not actively registered."
            ))
        else:
            portal_number = portal_udyam.get("udyam_registration_number")
            matched = mp.normalize(declared_number) == mp.normalize(portal_number)
            checks.append(_make_check(
                "udyam_claim_verifiable", PASS if matched else FAIL,
                declared_number, portal_number,
                "Udyam registration number matches portal record." if matched else
                "Udyam registration number on the bid does not match the portal record."
            ))
    elif declared_registered == "no" and actually_registered:
        checks.append(_make_check(
            "udyam_claim_verifiable", INFO, declared_registered, "has active Udyam record",
            "Bidder declared no Udyam registration, but an active Udyam record exists for this GSTIN in portal data. Not a compliance failure, but worth a manual look."
        ))
    else:
        checks.append(_make_check(
            "udyam_claim_verifiable", WARNING, fields.get("udyam_msme_registered"), "Yes or No",
            "Bidder did not clearly declare Yes/No for Udyam/MSME registration on the bid form - this is a mandatory declaration and should be confirmed manually."
        ))

    return checks


def _check_startup_india_claim(fields: dict, gstin: str) -> List[dict]:
    checks: List[dict] = []
    declared = (fields.get("startup_india_dpiit_recognized") or "").strip().lower()
    portal_startup = mp.query_startup_india_portal(gstin)
    actually_recognized = bool(
        portal_startup and portal_startup.get("dpiit_recognition_number") and portal_startup.get("recognition_status") == "Active"
    )

    if declared == "yes":
        checks.append(_make_check(
            "startup_india_claim_verifiable", PASS if actually_recognized else FAIL,
            declared, (portal_startup or {}).get("recognition_status"),
            "Startup India / DPIIT recognition confirmed as Active in portal data."
            if actually_recognized else
            "Bidder claims DPIIT recognition but the portal record shows it is not Active."
        ))
    elif declared == "no" and actually_recognized:
        checks.append(_make_check(
            "startup_india_claim_verifiable", INFO, declared, "has active DPIIT recognition",
            "Bidder declared no Startup India / DPIIT recognition, but an active recognition record exists for this GSTIN in portal data. Not a compliance failure, but worth a manual look."
        ))
    else:
        checks.append(_make_check(
            "startup_india_claim_verifiable", WARNING, declared, "Yes or No",
            "Startup India DPIIT recognition was not clearly declared."
        ))
    return checks


def _check_msme_exemption_consistency(fields: dict) -> List[dict]:
    checks: List[dict] = []
    exemption_claimed = (fields.get("msme_exemption_claimed") or "").strip().lower()
    udyam_registered = (fields.get("udyam_msme_registered") or "").strip().lower()

    if exemption_claimed == "yes" and udyam_registered != "yes":
        checks.append(_make_check(
            "msme_exemption_consistent", FAIL, exemption_claimed, "requires udyam_msme_registered=Yes",
            "MSME exemption claimed but bidder is not marked as Udyam/MSME registered on the same form - internally inconsistent self-declaration."
        ))
    else:
        checks.append(_make_check(
            "msme_exemption_consistent", PASS, exemption_claimed, None,
            "MSME exemption claim is internally consistent with Udyam registration status."
        ))
    return checks


# Scoring helpers

def _compute_score_and_risk(checks: List[dict]) -> Dict[str, Any]:
    # penalties per occurrence
    penalties = {CRITICAL: 50, FAIL: 25, WARNING: 10, INFO: 0, PASS: 0}
    total_penalty = sum(penalties.get(c["status"], 0) for c in checks)
    raw_score = max(0, 100 - total_penalty)
    # clamp
    score = max(0, min(100, raw_score))
    if score >= 80:
        risk = "LOW"
    elif score >= 50:
        risk = "MEDIUM"
    else:
        risk = "HIGH"

    # confidence: percent of PASS checks among all checks (simple heuristic)
    total_checks = len(checks) if checks else 1
    pass_count = sum(1 for c in checks if c["status"] == PASS)
    confidence = int((pass_count / total_checks) * 100)

    return {"score": score, "risk_level": risk, "confidence_pct": confidence}


# Public API

def verify_vendor(extracted_bid: dict) -> dict:
    """
    Verify one extracted bid dict:
      { "source_file": "...", "fields": {...} }

    Returns a dict with:
      - source_file, gstin, vendor_found_in_registry, overall_status, checks (list)
      - score (0-100), risk_level ("LOW"/"MEDIUM"/"HIGH"), confidence_pct (0-100)
    """
    fields = extracted_bid.get("fields", {}) or {}
    raw_gstin = fields.get("gstin")
    source_file = extracted_bid.get("source_file", "<unknown>")

    if not raw_gstin:
        result = {
            "source_file": source_file,
            "gstin": None,
            "vendor_found_in_registry": False,
            "overall_status": CRITICAL,
            "checks": [
                _make_check(
                    "vendor_lookup", CRITICAL, None, None,
                    "No GSTIN could be extracted from this bid - identity cannot be verified at all."
                )
            ],
        }
        # add score/risk/confidence
        meta = _compute_score_and_risk(result["checks"])
        result.update(meta)
        return result

    gstin = mp.normalize(raw_gstin)
    vendor = mp.get_vendor_by_gstin(gstin)
    if not vendor:
        result = {
            "source_file": source_file,
            "gstin": gstin,
            "vendor_found_in_registry": False,
            "overall_status": CRITICAL,
            "checks": [
                _make_check(
                    "vendor_lookup", CRITICAL, gstin, None,
                    f"GSTIN '{gstin}' declared on the bid has no matching record in the government portal registry. This bidder cannot be verified and should not be qualified without manual investigation."
                )
            ],
        }
        meta = _compute_score_and_risk(result["checks"])
        result.update(meta)
        return result

    checks: List[dict] = []
    checks.append(_make_check("vendor_lookup", PASS, gstin, gstin, "GSTIN found in government portal registry."))
    checks.extend(_check_identity_numbers(fields, vendor))
    checks.extend(_check_names(fields, vendor))
    checks.extend(_check_registration_and_debarment(vendor))
    checks.extend(_check_udyam_claim(fields, gstin))
    checks.extend(_check_startup_india_claim(fields, gstin))
    checks.extend(_check_msme_exemption_consistency(fields))

    severities = {c["status"] for c in checks}
    if CRITICAL in severities:
        overall = CRITICAL
    elif FAIL in severities:
        overall = FAIL
    elif WARNING in severities:
        overall = WARNING
    else:
        overall = PASS

    meta = _compute_score_and_risk(checks)

    result = {
        "source_file": source_file,
        "gstin": gstin,
        "vendor_found_in_registry": True,
        "overall_status": overall,
        "checks": checks,
    }
    result.update(meta)
    return result


def verify_all(extracted_bids: List[dict]) -> List[dict]:
    return [verify_vendor(bid) for bid in extracted_bids]


# CLI convenience: run verify on extractor output if present
def main() -> None:
    try:
        from services.ai import extractor as ext
    except Exception:
        logger.error("Extractor module not found; cannot run CLI end-to-end.")
        raise

    extracted = ext.extract_all_bids()
    results = verify_all(extracted)

    for r in results:
        flagged = [c for c in r["checks"] if c["status"] != PASS]
        print(f"{r['source_file']:35s} overall={r['overall_status']:10s} score={r.get('score',0):3d} flagged_checks={len(flagged)}")
        for c in flagged:
            print(f"    [{c['status']}] {c['check']}: {c['message']}")

    out_path = ext.PROJECT_ROOT / "vendor_verification_results.json"
    out_path.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {out_path}")


if __name__ == "__main__":
    main()