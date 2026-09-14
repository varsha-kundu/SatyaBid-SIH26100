"""
SIH GeM Bid Compliance Platform (PS ID: 26100)
services/verification/tender_verifier.py
---------------------------------------------------------
Step 3 (part 2) - Tender-Specific Eligibility Engine.

Takes ONE extracted bid record (the dict `extractor.extract_bid()`
returns) and cross-checks the bidder's verified portal data against
THIS TENDER's specific numeric thresholds: minimum annual turnover and
minimum local content %, with correct handling of the MSME turnover
exemption.

This module deliberately does NOT verify bidder identity (PAN/CIN/name
matching, debarment, Udyam claim truthfulness) - that's vendor_verifier.py.
It also deliberately does NOT verify mandatory certifications (BIS,
ISO 9001, NSIC) - cert_verifier.py already owns that end to end (number
matching, expiry, status-vs-date consistency), and re-checking it here
would silently double-count the same certificate finding once in each
engine's output once scorer.py (Step 4) starts tallying FAIL/WARNING
counts across all three files. If a tender-specific requirement about
certifications is ever needed (e.g. "must be valid for the full contract
term", not just "valid today"), that logic belongs in cert_verifier.py
too, since it already holds the expiry data this file would otherwise
have to duplicate.

Keeping these separate means each file has one reason to change, and
lets scorer.py decide independently how much weight an identity mismatch
vs. a turnover shortfall vs. an expired certificate should carry - each
finding counted exactly once, by exactly one engine.

Because tender-specific checks are only meaningful once we know who the
bidder actually is, verify_tender_eligibility() runs the same
vendor-lookup guard vendor_verifier.py does, so this file is safe to call
standalone (e.g. from tests, or before scorer.py exists to orchestrate
both) without crashing on an unverifiable bidder.
"""

from __future__ import annotations

import json
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any, Optional

if __package__ in (None, ""):
    # Allows `python services/verification/tender_verifier.py` to work
    # directly, not just `python -m services.verification.tender_verifier`.
    # See vendor_verifier.py for the full explanation of why this is
    # needed - the two files share the same package-layout constraint.
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from services.verification import mock_portals as mp

# ---------------------------------------------------------
# Severity levels - identical vocabulary to vendor_verifier.py so
# scorer.py (Step 4) can aggregate both files' output uniformly.
# ---------------------------------------------------------

CRITICAL = "CRITICAL"
FAIL = "FAIL"
WARNING = "WARNING"
PASS = "PASS"
INFO = "INFO"

def _make_check(name: str, status: str, declared: Any, expected: Any, message: str) -> dict:
    return {
        "check": name,
        "status": status,
        "declared": declared,
        "expected": expected,
        "message": message,
    }


def _is_actually_msme_registered(udyam_section: Optional[dict]) -> bool:
    """Mirrors vendor_verifier._is_actually_udyam_registered() - kept as
    a small local copy rather than a cross-module import of a private
    helper, since both files need to stay independently runnable. If the
    Udyam schema ever changes, update both copies together."""
    if not udyam_section:
        return False
    return bool(udyam_section.get("udyam_registration_number")) and \
        udyam_section.get("registration_status") == "Active"


# ---------------------------------------------------------
# Individual checks
# ---------------------------------------------------------

def _check_turnover(fields: dict, vendor: dict, tender_reqs: dict) -> list[dict]:
    checks = []
    min_turnover = tender_reqs.get("min_annual_turnover_cr")
    if min_turnover is None:
        return checks  # tender doesn't specify a turnover threshold at all

    actual_turnover = vendor.get("financials", {}).get("annual_turnover_cr")

    exemption_allowed = bool(tender_reqs.get("msme_exemption_allowed"))
    exemption_claimed = (fields.get("msme_exemption_claimed") or "").strip().lower() == "yes"
    actually_msme = _is_actually_msme_registered(vendor.get("udyam_msme"))
    exemption_applies = exemption_allowed and exemption_claimed and actually_msme

    # Only surface an exemption-eligibility row when the bidder actually
    # claimed one - otherwise every non-MSME bidder gets a noisy row that
    # never applied to them in the first place.
    if exemption_claimed:
        if not exemption_allowed:
            checks.append(_make_check(
                "msme_exemption_eligibility", FAIL, "Exemption claimed", "Not offered by this tender",
                "Bidder claimed the MSME turnover exemption, but this tender's requirements do not "
                "offer one (msme_exemption_allowed is false)."
            ))
        elif not actually_msme:
            checks.append(_make_check(
                "msme_exemption_eligibility", FAIL, "Exemption claimed",
                "Active Udyam/MSME registration",
                "Bidder claimed the MSME turnover exemption, but the portal record shows they are not "
                "an actively registered MSME - exemption cannot be applied."
            ))
        else:
            checks.append(_make_check(
                "msme_exemption_eligibility", INFO, "Exemption claimed", "Verified eligible",
                "MSME turnover exemption verified against portal Udyam record and applied - the minimum "
                "turnover threshold below is waived for this bidder."
            ))

    if exemption_applies:
        checks.append(_make_check(
            "annual_turnover_meets_threshold", INFO, actual_turnover, f">= {min_turnover} cr (waived)",
            f"Turnover threshold waived via verified MSME exemption. Bidder's actual turnover on file "
            f"is {actual_turnover if actual_turnover is not None else 'not recorded'} cr, shown for "
            f"reference only."
        ))
    elif actual_turnover is None:
        checks.append(_make_check(
            "annual_turnover_meets_threshold", FAIL, None, f">= {min_turnover} cr",
            "No annual turnover figure is on file for this vendor - cannot verify the tender's minimum "
            "turnover requirement."
        ))
    else:
        meets = actual_turnover >= min_turnover
        checks.append(_make_check(
            "annual_turnover_meets_threshold", PASS if meets else FAIL,
            actual_turnover, f">= {min_turnover} cr",
            f"Verified annual turnover ({actual_turnover} cr) meets the tender's minimum ({min_turnover} cr)."
            if meets else
            f"Verified annual turnover ({actual_turnover} cr) is below the tender's minimum ({min_turnover} cr)."
        ))

    # Optional cross-check: if the extracted bid form itself declares a
    # turnover figure, flag a mismatch against the portal-verified figure.
    # This is genuinely optional - extractor.py (Step 2) may or may not
    # pull this field depending on whether bid forms even ask for it, so
    # its absence is not itself a finding.
    declared_turnover = fields.get("declared_annual_turnover_cr")
    if declared_turnover is not None and actual_turnover is not None:
        try:
            mismatch = abs(float(declared_turnover) - float(actual_turnover)) > 0.05
        except (TypeError, ValueError):
            mismatch = False
        if mismatch:
            checks.append(_make_check(
                "turnover_matches_self_declaration", WARNING, declared_turnover, actual_turnover,
                f"Bid form declares turnover of {declared_turnover} cr, but verified financial records "
                f"show {actual_turnover} cr - worth confirming which figure is correct."
            ))

    return checks


def _check_local_content(fields: dict, vendor: dict, tender_reqs: dict) -> list[dict]:
    checks = []
    min_pct = tender_reqs.get("min_local_content_pct")
    if min_pct is None:
        return checks

    mii = vendor.get("make_in_india")
    if not mii:
        checks.append(_make_check(
            "local_content_meets_threshold", FAIL, None, f">= {min_pct}%",
            "No Make in India declaration is on file for this vendor - cannot verify the tender's "
            "minimum local content requirement."
        ))
        return checks

    actual_pct = mii.get("local_content_percentage")
    if actual_pct is None:
        checks.append(_make_check(
            "local_content_meets_threshold", FAIL, None, f">= {min_pct}%",
            "Make in India declaration on file does not specify a local content percentage."
        ))
    else:
        meets = actual_pct >= min_pct
        checks.append(_make_check(
            "local_content_meets_threshold", PASS if meets else FAIL,
            f"{actual_pct}%", f">= {min_pct}%",
            f"Verified local content ({actual_pct}%) meets the tender's minimum ({min_pct}%)."
            if meets else
            f"Verified local content ({actual_pct}%) is below the tender's minimum ({min_pct}%)."
        ))

    country = mii.get("country_of_origin")
    if country and country != "India":
        checks.append(_make_check(
            "country_of_origin_is_india", FAIL, country, "India",
            f"Make in India declaration lists country of origin as '{country}', not India."
        ))
    elif not country:
        checks.append(_make_check(
            "country_of_origin_is_india", WARNING, None, "India",
            "Make in India declaration on file does not specify a country of origin."
        ))

    declared_pct = fields.get("declared_local_content_pct")
    if declared_pct is not None and actual_pct is not None:
        try:
            mismatch = abs(float(declared_pct) - float(actual_pct)) > 0.5
        except (TypeError, ValueError):
            mismatch = False
        if mismatch:
            checks.append(_make_check(
                "local_content_matches_self_declaration", WARNING, declared_pct, actual_pct,
                f"Bid form declares {declared_pct}% local content, but the verified Make in India "
                f"record shows {actual_pct}% - worth confirming which figure is correct."
            ))

    return checks


# ---------------------------------------------------------
# Public API
# ---------------------------------------------------------

def verify_tender_eligibility(extracted_bid: dict, *, as_of: Optional[date] = None) -> dict:
    """extracted_bid is one element of extractor.extract_all_bids()'s
    return value (i.e. has 'source_file', 'extraction_issues', 'fields').

    as_of has no effect on this module's own checks today (turnover and
    local content aren't date-sensitive) - it's kept in the signature so
    callers iterating over vendor_verifier / cert_verifier / tender_verifier
    together can pass one shared reference date to all three without
    special-casing this one. Defaults to the real current date."""
    as_of = as_of or date.today()
    fields = extracted_bid.get("fields", {})
    gstin = fields.get("gstin")
    source_file = extracted_bid.get("source_file", "<unknown>")

    if not gstin:
        return {
            "source_file": source_file,
            "gstin": None,
            "vendor_found_in_registry": False,
            "overall_status": CRITICAL,
            "checks": [_make_check(
                "vendor_lookup", CRITICAL, None, None,
                "No GSTIN could be extracted from this bid - tender-specific eligibility cannot be "
                "evaluated without a verified vendor record."
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
                "tender-specific eligibility cannot be evaluated."
            )],
        }

    tender_reqs = mp.get_tender_requirements()

    checks: list[dict] = []
    checks.extend(_check_turnover(fields, vendor, tender_reqs))
    checks.extend(_check_local_content(fields, vendor, tender_reqs))
    # Mandatory-certification checks (BIS, ISO 9001, NSIC) intentionally
    # live in cert_verifier.py, not here - see this module's docstring.

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
        "tender_id": tender_reqs.get("tender_id"),
        "overall_status": overall,
        "checks": checks,
    }


def verify_all(extracted_bids: list[dict], *, as_of: Optional[date] = None) -> list[dict]:
    return [verify_tender_eligibility(bid, as_of=as_of) for bid in extracted_bids]


# ---------------------------------------------------------
# CLI - runs against services/ai/extractor.py's output
# ---------------------------------------------------------

def main() -> None:
    from services.ai import extractor as ext

    extracted = ext.extract_all_bids()
    results = verify_all(extracted)

    for r in results:
        flagged = [c for c in r["checks"] if c["status"] != PASS]
        print(f"{r['source_file']:35s} overall={r['overall_status']:10s} flagged_checks={len(flagged)}")
        for c in flagged:
            print(f"    [{c['status']}] {c['check']}: {c['message']}")

    out_path = ext.PROJECT_ROOT / "tender_verification_results.json"
    out_path.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {out_path}")


if __name__ == "__main__":
    main()