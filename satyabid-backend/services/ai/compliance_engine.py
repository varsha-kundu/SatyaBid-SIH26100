"""
SIH GeM Bid Compliance Platform (PS ID: 26100)
services/ai/compliance_engine.py
---------------------------------------------------------
Step 4 - Unified AI Verification Engine.

Runs vendor_verifier.py, tender_verifier.py and cert_verifier.py
against ONE extracted bid and merges their three independent check
lists into a single Compliance Report: one overall status, one 0-100
compliance score, one risk level, a category-level breakdown, a
plain-English AI recommendation, and a tamper-evident integrity hash
for the audit trail.

Design contract with the three engines it calls
-------------------------------------------------
Each of vendor_verifier.verify_vendor(), tender_verifier.verify_tender_eligibility()
and cert_verifier.verify_certificates() independently returns:

    {
      "source_file": str,
      "gstin": str | None,
      "vendor_found_in_registry": bool,
      "overall_status": "CRITICAL" | "FAIL" | "WARNING" | "PASS",
      "checks": [ {"check", "status", "declared", "expected", "message"}, ... ],
      ... (engine-specific extra keys, e.g. vendor_verifier's score/risk_level)
    }

This module treats that shape as a contract and never reaches into an
engine's private helpers - if an engine's output shape ever changes,
only the small `_ENGINES` table below needs updating.

Why aggregation isn't just "sum the three overall_statuses"
-------------------------------------------------------------
1. Vendor-not-found is not three independent findings. When a GSTIN
   can't be resolved, all three engines emit their own CRITICAL
   "vendor_lookup" check (each needs the vendor record to do its own
   job). Summing that as three CRITICAL penalties would triple-count
   the same root cause. This engine detects that case up front and
   reports ONE consolidated "vendor not found" result instead of
   running the full aggregation.
2. Every engine that *does* find the vendor still emits its own PASS
   "vendor_lookup" check. Three duplicate PASS rows carry no
   information for a human reading the dashboard, so they're
   deduplicated down to one in the merged check list (the score is
   unaffected either way, since PASS carries zero penalty).
3. Different engines matter differently to a procurement officer's
   decision: an identity mismatch (vendor_verifier) is a more serious
   signal than a single missing optional field. Scoring below applies
   the same severity-penalty table every engine already uses
   internally, so a CRITICAL from any engine costs the same - the
   weighting that matters (identity vs. eligibility vs. certificates)
   comes from which checks exist in each engine, not from a second
   layer of per-engine multipliers this file would otherwise have to
   invent and justify.

The Procurement Officer always makes the final qualify/disqualify
call; this module's "recommendation" field is explicitly advisory,
never a decision.
"""

from __future__ import annotations

import hashlib
import json
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Optional

if __package__ in (None, ""):
    # Allows `python services/ai/compliance_engine.py` to work directly,
    # not just `python -m services.ai.compliance_engine` - same reasoning
    # as vendor_verifier.py / tender_verifier.py.
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from services.verification.vendor_verifier import verify_vendor
from services.verification.tender_verifier import verify_tender_eligibility
from services.verification.cert_verifier import verify_certificates
from services.verification import mock_portals as mp

# ---------------------------------------------------------
# Severity vocabulary - identical to all three engines, so their
# check lists can be merged without a translation layer.
# ---------------------------------------------------------

CRITICAL = "CRITICAL"
FAIL = "FAIL"
WARNING = "WARNING"
PASS = "PASS"
INFO = "INFO"

_SEVERITY_RANK = {CRITICAL: 4, FAIL: 3, WARNING: 2, INFO: 1, PASS: 0}
_PENALTY = {CRITICAL: 50, FAIL: 25, WARNING: 10, INFO: 0, PASS: 0}

_RISK_THRESHOLDS = (
    # (minimum score inclusive, risk label)
    (80, "LOW"),
    (50, "MEDIUM"),
    (0, "HIGH"),
)

# Each engine's callable, the human-readable category name used in the
# dashboard breakdown, and the key the category's checks are filed
# under. Adding a fourth engine later (e.g. a Make in India-specific
# engine) is one new row here, not a new branch scattered through the
# aggregation logic below.
_ENGINES: tuple[tuple[str, str, Any], ...] = (
    ("identity_and_registration", "Vendor Identity & Statutory Registration", verify_vendor),
    ("tender_eligibility", "Tender-Specific Eligibility", verify_tender_eligibility),
    ("certifications", "Mandatory Certifications", verify_certificates),
)


# ---------------------------------------------------------
# Small helpers
# ---------------------------------------------------------

def _worst_status(statuses: list[str]) -> str:
    """Returns the single most severe status in the list, defaulting to
    PASS for an empty list (nothing flagged is a clean pass, not an
    unknown state)."""
    if not statuses:
        return PASS
    return max(statuses, key=lambda s: _SEVERITY_RANK.get(s, 0))


def _score_from_checks(checks: list[dict]) -> int:
    total_penalty = sum(_PENALTY.get(c.get("status"), 0) for c in checks)
    return max(0, min(100, 100 - total_penalty))


def _risk_from_score(score: int) -> str:
    for minimum, label in _RISK_THRESHOLDS:
        if score >= minimum:
            return label
    return "HIGH"  # unreachable given the thresholds above end at 0, kept for safety


def _canonical_json(payload: Any) -> str:
    """Deterministic JSON serialization (sorted keys, fixed separators)
    so the same logical content always hashes to the same value,
    regardless of dict insertion order."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _integrity_hash(payload: Any) -> str:
    """SHA-256 fingerprint of the report's substantive content. This is
    a tamper-evidence primitive for the audit trail (item 14 of the
    problem statement) - it lets anyone re-hash a stored report later
    and confirm it hasn't been silently edited. It is NOT a substitute
    for a full audit log (who ran the check, when, prior overrides);
    that belongs in audit_logger.py, which can store this hash
    alongside its own metadata rather than recomputing report content."""
    return hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()


def _dedupe_vendor_lookup(checks: list[dict], keep_first: bool) -> list[dict]:
    """Each engine emits its own 'vendor_lookup' check. Keep exactly one
    copy in the merged list (the first one, from the identity engine,
    since that's the canonical source of truth for whether the vendor
    resolved) and drop the rest - they're identical in substance and
    would otherwise triple up on every single report."""
    out: list[dict] = []
    seen = False
    for c in checks:
        if c.get("check") == "vendor_lookup":
            if keep_first and not seen:
                out.append(c)
                seen = True
            continue
        out.append(c)
    return out


# ---------------------------------------------------------
# Recommendation text - advisory only, never a decision
# ---------------------------------------------------------

def _build_recommendation(overall_status: str, flagged: list[dict]) -> str:
    critical_count = sum(1 for c in flagged if c["status"] == CRITICAL)
    fail_count = sum(1 for c in flagged if c["status"] == FAIL)
    warning_count = sum(1 for c in flagged if c["status"] == WARNING)

    if overall_status == CRITICAL:
        return (
            f"AI recommendation: HOLD for manual investigation. {critical_count} critical "
            f"finding(s) (e.g. identity mismatch, debarment, or an unresolvable vendor record) "
            f"must be resolved before this bidder can be considered. Final decision rests with "
            f"the Procurement Officer."
        )
    if overall_status == FAIL:
        return (
            f"AI recommendation: DO NOT QUALIFY as submitted. {fail_count} mandatory "
            f"requirement(s) are not met against verified portal data"
            + (f", plus {warning_count} item(s) needing manual review" if warning_count else "")
            + ". Final decision rests with the Procurement Officer."
        )
    if overall_status == WARNING:
        return (
            f"AI recommendation: CONDITIONAL - {warning_count} item(s) could not be fully "
            f"confirmed from available data and need manual review before qualification. No "
            f"statutory or eligibility requirement was found to be violated. Final decision "
            f"rests with the Procurement Officer."
        )
    return (
        "AI recommendation: QUALIFY. All statutory registrations, tender-specific eligibility "
        "thresholds, and mandatory certifications were verified against portal data with no "
        "outstanding issues. Final decision rests with the Procurement Officer."
    )


# ---------------------------------------------------------
# Public API
# ---------------------------------------------------------

def evaluate_bid(extracted_bid: dict, *, as_of: Optional[date] = None) -> dict:
    """Runs all three verification engines against one extracted bid
    (the same `{"source_file", "fields"}` shape every engine already
    accepts) and returns a single unified Compliance Report.

    as_of is forwarded to every engine that accepts it, so a caller
    evaluating a batch of historical bids can pin one reference date
    across the whole run instead of each engine defaulting to
    datetime.now() independently (which would make results
    non-reproducible if a batch run crosses midnight).
    """
    as_of = as_of or date.today()
    source_file = extracted_bid.get("source_file", "<unknown>")
    fields = extracted_bid.get("fields", {}) or {}
    gstin = mp.normalize(fields.get("gstin")) or None

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    # --- Run every engine up front. Each is independently defensive
    # (never raises for a missing/unresolvable vendor - it returns a
    # CRITICAL "vendor_lookup" check instead), so no try/except is
    # needed here; a genuine bug inside an engine should surface as a
    # real traceback rather than being swallowed into a fake report.
    engine_results: dict[str, dict] = {}
    for key, label, fn in _ENGINES:
        if key == "identity_and_registration":
            engine_results[key] = fn(extracted_bid)
        else:
            engine_results[key] = fn(extracted_bid, as_of=as_of)

    vendor_found = any(r.get("vendor_found_in_registry") for r in engine_results.values())

    if not vendor_found:
        # Consolidate into ONE finding instead of three duplicate
        # CRITICALs - see module docstring, point 1.
        report = {
            "source_file": source_file,
            "gstin": gstin,
            "generated_at": generated_at,
            "vendor_found_in_registry": False,
            "overall_status": CRITICAL,
            "compliance_score": 0,
            "risk_level": "HIGH",
            "checks": [{
                "check": "vendor_lookup",
                "status": CRITICAL,
                "declared": gstin,
                "expected": None,
                "message": (
                    f"GSTIN '{gstin}' has no matching record in the government portal registry - "
                    "no statutory, eligibility, or certification check can be performed."
                    if gstin else
                    "No GSTIN could be extracted from this bid - identity could not be established, "
                    "so no further verification is possible."
                ),
            }],
            "categories": {
                key: {"label": label, "status": CRITICAL, "score": 0, "checks": []}
                for key, label, _ in _ENGINES
            },
            "recommendation": (
                "AI recommendation: HOLD for manual investigation. The bidder's identity could not "
                "be established against government portal records at all. Final decision rests with "
                "the Procurement Officer."
            ),
        }
        report["integrity_hash"] = _integrity_hash(report)
        return report

    # --- Vendor resolved: merge all three engines' checks into one
    # dashboard-ready list, tagging each with which engine raised it.
    categories: dict[str, dict] = {}
    merged_checks: list[dict] = []

    for idx, (key, label, _fn) in enumerate(_ENGINES):
        result = engine_results[key]
        checks = _dedupe_vendor_lookup(result.get("checks", []), keep_first=(idx == 0))
        score = _score_from_checks(result.get("checks", []))  # score off the engine's own full list
        categories[key] = {
            "label": label,
            "status": result.get("overall_status", PASS),
            "score": score,
            "checks": checks,
        }
        for c in checks:
            merged_checks.append({**c, "source_engine": key})

    overall_status = _worst_status([cat["status"] for cat in categories.values()])
    compliance_score = _score_from_checks(merged_checks)
    risk_level = _risk_from_score(compliance_score)

    flagged = [c for c in merged_checks if c["status"] != PASS]
    flagged.sort(key=lambda c: _SEVERITY_RANK.get(c["status"], 0), reverse=True)

    report = {
        "source_file": source_file,
        "gstin": gstin,
        "generated_at": generated_at,
        "vendor_found_in_registry": True,
        "overall_status": overall_status,
        "compliance_score": compliance_score,
        "risk_level": risk_level,
        "checks": merged_checks,
        "flagged_checks": flagged,
        "categories": categories,
        "recommendation": _build_recommendation(overall_status, flagged),
    }
    report["integrity_hash"] = _integrity_hash(report)
    return report


def evaluate_all(extracted_bids: list[dict], *, as_of: Optional[date] = None) -> list[dict]:
    return [evaluate_bid(bid, as_of=as_of) for bid in extracted_bids]


def dashboard_summary(reports: list[dict]) -> dict:
    """Rolls a batch of Compliance Reports up into the aggregate numbers
    a Compliance Dashboard's top strip would show (counts by status,
    average score, highest-risk bidders first)."""
    by_status = {CRITICAL: 0, FAIL: 0, WARNING: 0, PASS: 0}
    for r in reports:
        by_status[r.get("overall_status", PASS)] = by_status.get(r.get("overall_status", PASS), 0) + 1

    scored = [r for r in reports if isinstance(r.get("compliance_score"), int)]
    avg_score = round(sum(r["compliance_score"] for r in scored) / len(scored), 1) if scored else 0.0

    ranked = sorted(reports, key=lambda r: r.get("compliance_score", 0))

    return {
        "total_bids": len(reports),
        "by_status": by_status,
        "average_compliance_score": avg_score,
        "highest_risk_first": [
            {"source_file": r["source_file"], "gstin": r.get("gstin"),
             "compliance_score": r.get("compliance_score"), "risk_level": r.get("risk_level")}
            for r in ranked
        ],
    }


# ---------------------------------------------------------
# CLI - runs against services/ai/extractor.py's output once it exists;
# falls back to a small built-in demo set so this file is runnable
# and demoable today, standalone, without waiting on Step 2.
# ---------------------------------------------------------

def _demo_bids() -> list[dict]:
    """A handful of extracted-bid-shaped dicts built directly from
    entries already in dummy_records.json, so `python compliance_engine.py`
    produces a real, varied Compliance Report end to end today - one
    fully clean bidder, one with a deliberate identity mismatch, and
    one with a GSTIN not present in the registry at all."""
    vendors = mp.get_all_vendors()
    gstins = list(vendors.keys())
    demo: list[dict] = []

    if gstins:
        clean_gstin = gstins[0]
        clean_vendor = vendors[clean_gstin]
        demo.append({
            "source_file": "demo_bid_clean.pdf",
            "fields": {
                "gstin": clean_gstin,
                "pan": clean_vendor.get("pan_it", {}).get("pan"),
                "cin": clean_vendor.get("mca21", {}).get("cin"),
                "legal_name": clean_vendor.get("gstn", {}).get("legal_name"),
                "udyam_msme_registered": "Yes" if clean_vendor.get("udyam_msme") else "No",
                "udyam_registration_number": (clean_vendor.get("udyam_msme") or {}).get("udyam_registration_number"),
                "startup_india_dpiit_recognized": "Yes" if clean_vendor.get("startup_india") else "No",
                "bis_certificate_number": clean_vendor.get("certifications", {}).get("bis", {}).get("certificate_number"),
                "iso_9001_certificate_number": clean_vendor.get("certifications", {}).get("iso_9001", {}).get("certificate_number"),
            },
        })
        demo.append({
            "source_file": "demo_bid_mismatched_pan.pdf",
            "fields": {
                "gstin": clean_gstin,
                "pan": "ZZZZZ0000Z",  # deliberately wrong, to exercise the CRITICAL path
                "legal_name": clean_vendor.get("gstn", {}).get("legal_name"),
            },
        })

    demo.append({
        "source_file": "demo_bid_unregistered.pdf",
        "fields": {"gstin": "00ZZZZZ0000Z0Z0"},
    })
    return demo


def main() -> None:
    try:
        from services.ai import extractor as ext
        extracted = ext.extract_all_bids()
        project_root = ext.PROJECT_ROOT
    except ImportError:
        print("[compliance_engine] services.ai.extractor not found yet - running on a small "
              "built-in demo set instead (see _demo_bids()).\n")
        extracted = _demo_bids()
        project_root = Path(__file__).resolve().parents[2]

    reports = evaluate_all(extracted)

    for r in reports:
        print(f"{r['source_file']:35s} overall={r['overall_status']:10s} "
              f"score={r['compliance_score']:3d} risk={r['risk_level']:6s}")
        print(f"    {r['recommendation']}")

    summary = dashboard_summary(reports)
    print("\n--- Dashboard summary ---")
    print(json.dumps(summary, indent=2, ensure_ascii=False))

    out_path = project_root / "compliance_reports.json"
    out_path.write_text(json.dumps(reports, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {out_path}")


if __name__ == "__main__":
    main()