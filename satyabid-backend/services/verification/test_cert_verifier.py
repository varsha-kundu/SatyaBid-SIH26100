"""
SIH GeM Bid Compliance Platform (PS ID: 26100)
Step 3 (part 2) - Unit & Regression Tests for cert_verifier.py
---------------------------------------------------------
Run with:  pytest test_cert_verifier.py -v

Design notes for future-you:
- Most tests build a small synthetic vendor + tender via `_make_vendor`/
  `_make_tender` so they don't depend on dummy_records.json ever staying
  byte-for-byte the same.
- A handful of tests at the bottom deliberately load the REAL shipped
  dataset - these are regression tests pinned to the scenarios
  dummy_records.json's own `_meta.vendor_scenarios` documents (e.g. the
  vendor with a deliberately expired ISO 9001 cert), so a future edit to
  either file that breaks that alignment gets caught immediately.
"""

from __future__ import annotations

import copy
from datetime import date

import pytest

from services.verification import cert_verifier as cv
from services.verification import mock_portals as mp


# ---------------------------------------------------------
# Fixtures
# ---------------------------------------------------------

@pytest.fixture(autouse=True)
def _reset_module_state():
    mp._database_cache = None
    mp._database = None
    mp._pan_index = None
    mp._cin_index = None
    yield
    mp._database_cache = None
    mp._database = None
    mp._pan_index = None
    mp._cin_index = None


def _make_vendor(
    *,
    gstin="07AAACA1234K1Z2",
    bis_number="BIS/TEST/0001",
    bis_status="Valid",
    bis_valid_upto="14/01/2030",
    iso_number="ISO9001/TEST/0001",
    iso_status="Valid",
    iso_valid_upto="04/02/2030",
    nsic_number="NSIC-TEST-0001",
    nsic_status="Valid",
    nsic_valid_upto="09/03/2030",
) -> dict:
    return {
        "gstn": {"gstin": gstin, "legal_name": "Test Vendor Pvt Ltd", "registration_status": "Active"},
        "pan_it": {"pan": "AAACA1234K"},
        "mca21": {"cin": "U28112DL2019PTC345123"},
        "debarment_registry": {"registry_status": "No adverse record located"},
        "certifications": {
            "bis": {
                "certificate_number": bis_number,
                "certificate_status": bis_status,
                "valid_upto": bis_valid_upto,
            },
            "iso_9001": {
                "certificate_number": iso_number,
                "certificate_status": iso_status,
                "valid_upto": iso_valid_upto,
            },
        },
        "nsic": {
            "certificate_number": nsic_number,
            "certificate_status": nsic_status,
            "valid_upto": nsic_valid_upto,
        },
    }


def _make_tender(mandatory=("BIS", "ISO-9001")) -> dict:
    return {"mandatory_certifications": list(mandatory)}


@pytest.fixture
def clean_vendor_db(tmp_path, monkeypatch):
    vendor = _make_vendor()
    gstin = vendor["gstn"]["gstin"]
    data = {
        "tender_requirements": _make_tender(),
        "government_portals": {gstin: vendor},
    }
    import json
    db_path = tmp_path / "dummy_records.json"
    db_path.write_text(json.dumps(data), encoding="utf-8")
    monkeypatch.setattr(mp, "DB_PATH", db_path)
    return {"gstin": gstin, "vendor": vendor, "tender": data["tender_requirements"]}


def _matching_bid(gstin: str, vendor: dict, source_file="bid.pdf") -> dict:
    return {
        "source_file": source_file,
        "fields": {
            "gstin": gstin,
            "bis_certificate_number": vendor["certifications"]["bis"]["certificate_number"],
            "iso_9001_certificate_number": vendor["certifications"]["iso_9001"]["certificate_number"],
            "nsic_certificate_number": vendor["nsic"]["certificate_number"],
        },
    }


REFERENCE_DATE = date(2026, 8, 31)


# ---------------------------------------------------------
# Date parsing / expiry helpers
# ---------------------------------------------------------

def test_parse_date_valid():
    assert cv._parse_date("14/01/2028") == date(2028, 1, 14)


@pytest.mark.parametrize("bad", [None, "", "2028-01-14", "not-a-date", 12345])
def test_parse_date_invalid_returns_none(bad):
    assert cv._parse_date(bad) is None


def test_is_expired_true_for_past_date():
    assert cv._is_expired("14/01/2020", REFERENCE_DATE) is True


def test_is_expired_false_for_future_date():
    assert cv._is_expired("14/01/2030", REFERENCE_DATE) is False


def test_is_expired_none_for_unparseable_date():
    assert cv._is_expired("garbage", REFERENCE_DATE) is None


def test_is_expired_none_for_missing_date():
    assert cv._is_expired(None, REFERENCE_DATE) is None


# ---------------------------------------------------------
# Certificate label normalization
# ---------------------------------------------------------

@pytest.mark.parametrize("label,expected", [
    ("BIS", "bis"),
    ("bis", "bis"),
    ("ISO-9001", "iso_9001"),
    ("iso 9001", "iso_9001"),
    ("ISO9001", "iso_9001"),
    ("NSIC", "nsic"),
])
def test_normalize_cert_label_recognizes_known_labels(label, expected):
    assert cv._normalize_cert_label(label) == expected


@pytest.mark.parametrize("label", ["CE MARKING", "", None, 123])
def test_normalize_cert_label_returns_none_for_unrecognized(label):
    assert cv._normalize_cert_label(label) is None


def test_resolve_mandatory_cert_keys_separates_recognized_and_not():
    tender = {"mandatory_certifications": ["BIS", "CE MARKING", "ISO-9001"]}
    recognized, unrecognized = cv._resolve_mandatory_cert_keys(tender)
    assert recognized == {"bis", "iso_9001"}
    assert unrecognized == ["CE MARKING"]


def test_resolve_mandatory_cert_keys_handles_missing_key():
    assert cv._resolve_mandatory_cert_keys({}) == (set(), [])


# ---------------------------------------------------------
# verify_certificates - vendor resolution
# ---------------------------------------------------------

def test_verify_certificates_no_gstin_is_critical():
    result = cv.verify_certificates({"source_file": "x.pdf", "fields": {}})
    assert result["overall_status"] == cv.CRITICAL
    assert result["vendor_found_in_registry"] is False


def test_verify_certificates_unknown_vendor_is_critical(clean_vendor_db):
    result = cv.verify_certificates(
        {"source_file": "x.pdf", "fields": {"gstin": "99ZZZZZ9999Z9Z9"}},
        tender_requirements=clean_vendor_db["tender"],
    )
    assert result["overall_status"] == cv.CRITICAL
    assert result["vendor_found_in_registry"] is False


# ---------------------------------------------------------
# verify_certificates - the fully-matching happy path
# ---------------------------------------------------------

def test_verify_certificates_all_valid_and_matching_is_pass(clean_vendor_db):
    bid = _matching_bid(clean_vendor_db["gstin"], clean_vendor_db["vendor"])
    result = cv.verify_certificates(bid, tender_requirements=clean_vendor_db["tender"], as_of=REFERENCE_DATE)
    assert result["overall_status"] == cv.PASS
    assert result["mandatory_certifications"] == ["bis", "iso_9001"]


# ---------------------------------------------------------
# Identifier normalization (OCR case/whitespace tolerance)
# ---------------------------------------------------------

def test_declared_number_matches_despite_case_and_whitespace(clean_vendor_db):
    bid = _matching_bid(clean_vendor_db["gstin"], clean_vendor_db["vendor"])
    bid["fields"]["bis_certificate_number"] = "  " + bid["fields"]["bis_certificate_number"].lower() + "  "
    result = cv.verify_certificates(bid, tender_requirements=clean_vendor_db["tender"], as_of=REFERENCE_DATE)
    check = next(c for c in result["checks"] if c["check"] == "bis_number_matches_registry")
    assert check["status"] == cv.PASS


def test_genuinely_different_declared_number_fails(clean_vendor_db):
    bid = _matching_bid(clean_vendor_db["gstin"], clean_vendor_db["vendor"])
    bid["fields"]["bis_certificate_number"] = "COMPLETELY-DIFFERENT-NUMBER"
    result = cv.verify_certificates(bid, tender_requirements=clean_vendor_db["tender"], as_of=REFERENCE_DATE)
    check = next(c for c in result["checks"] if c["check"] == "bis_number_matches_registry")
    assert check["status"] == cv.FAIL
    assert result["overall_status"] == cv.FAIL


def test_missing_declared_number_is_warning_not_fail(clean_vendor_db):
    """An extraction gap (OCR didn't find the number) is not the same
    severity as evidence the certificate is fraudulent."""
    bid = _matching_bid(clean_vendor_db["gstin"], clean_vendor_db["vendor"])
    del bid["fields"]["bis_certificate_number"]
    result = cv.verify_certificates(bid, tender_requirements=clean_vendor_db["tender"], as_of=REFERENCE_DATE)
    check = next(c for c in result["checks"] if c["check"] == "bis_declared_on_bid")
    assert check["status"] == cv.WARNING
    assert result["overall_status"] == cv.WARNING


# ---------------------------------------------------------
# Expiry - mandatory vs non-mandatory severity
# ---------------------------------------------------------

def test_expired_mandatory_certificate_fails(clean_vendor_db, monkeypatch):
    vendor = copy.deepcopy(clean_vendor_db["vendor"])
    vendor["certifications"]["iso_9001"]["valid_upto"] = "14/03/2026"  # in the past relative to REFERENCE_DATE
    monkeypatch.setattr(mp, "get_vendor_by_gstin", lambda g: vendor if g == clean_vendor_db["gstin"] else None)

    bid = _matching_bid(clean_vendor_db["gstin"], vendor)
    result = cv.verify_certificates(bid, tender_requirements=clean_vendor_db["tender"], as_of=REFERENCE_DATE)
    check = next(c for c in result["checks"] if c["check"] == "iso_9001_not_expired")
    assert check["status"] == cv.FAIL
    assert result["overall_status"] == cv.FAIL


def test_expired_non_mandatory_certificate_is_warning_only(clean_vendor_db, monkeypatch):
    vendor = copy.deepcopy(clean_vendor_db["vendor"])
    vendor["nsic"]["valid_upto"] = "10/05/2023"  # expired, but NSIC isn't in the tender's mandatory list
    monkeypatch.setattr(mp, "get_vendor_by_gstin", lambda g: vendor if g == clean_vendor_db["gstin"] else None)

    bid = _matching_bid(clean_vendor_db["gstin"], vendor)
    result = cv.verify_certificates(bid, tender_requirements=clean_vendor_db["tender"], as_of=REFERENCE_DATE)
    check = next(c for c in result["checks"] if c["check"] == "nsic_not_expired")
    assert check["status"] == cv.WARNING
    assert result["overall_status"] == cv.WARNING  # not FAIL - nothing mandatory was violated


def test_unparseable_expiry_date_is_warning(clean_vendor_db, monkeypatch):
    vendor = copy.deepcopy(clean_vendor_db["vendor"])
    vendor["certifications"]["bis"]["valid_upto"] = "not-a-date"
    monkeypatch.setattr(mp, "get_vendor_by_gstin", lambda g: vendor if g == clean_vendor_db["gstin"] else None)

    bid = _matching_bid(clean_vendor_db["gstin"], vendor)
    result = cv.verify_certificates(bid, tender_requirements=clean_vendor_db["tender"], as_of=REFERENCE_DATE)
    check = next(c for c in result["checks"] if c["check"] == "bis_not_expired")
    assert check["status"] == cv.WARNING


def test_status_disagrees_with_unexpired_date_is_warning(clean_vendor_db, monkeypatch):
    """Not expired by date, but certificate_status says something other
    than Valid (e.g. hand-edited or stale data) - a real inconsistency,
    not something to wave through as PASS."""
    vendor = copy.deepcopy(clean_vendor_db["vendor"])
    vendor["certifications"]["bis"]["certificate_status"] = "Suspended"
    monkeypatch.setattr(mp, "get_vendor_by_gstin", lambda g: vendor if g == clean_vendor_db["gstin"] else None)

    bid = _matching_bid(clean_vendor_db["gstin"], vendor)
    result = cv.verify_certificates(bid, tender_requirements=clean_vendor_db["tender"], as_of=REFERENCE_DATE)
    check = next(c for c in result["checks"] if c["check"] == "bis_not_expired")
    assert check["status"] == cv.WARNING


def test_expired_and_status_says_invalid_reports_expired_not_double_counted(clean_vendor_db, monkeypatch):
    """When BOTH the date has passed AND the status disagrees (e.g. a
    'Revoked' cert whose valid_upto is also in the past), expiry wins as
    the more concrete fact - exactly one check row, not two competing
    ones for the same certificate/field."""
    vendor = copy.deepcopy(clean_vendor_db["vendor"])
    vendor["certifications"]["bis"]["certificate_status"] = "Revoked"
    vendor["certifications"]["bis"]["valid_upto"] = "13/06/2025"
    monkeypatch.setattr(mp, "get_vendor_by_gstin", lambda g: vendor if g == clean_vendor_db["gstin"] else None)

    bid = _matching_bid(clean_vendor_db["gstin"], vendor)
    result = cv.verify_certificates(bid, tender_requirements=clean_vendor_db["tender"], as_of=REFERENCE_DATE)
    expiry_checks = [c for c in result["checks"] if c["check"] == "bis_not_expired"]
    assert len(expiry_checks) == 1
    assert expiry_checks[0]["status"] == cv.FAIL


# ---------------------------------------------------------
# Missing certificate records
# ---------------------------------------------------------

def test_missing_mandatory_certificate_record_fails(clean_vendor_db, monkeypatch):
    bid = _matching_bid(clean_vendor_db["gstin"], clean_vendor_db["vendor"])
    vendor = copy.deepcopy(clean_vendor_db["vendor"])
    vendor["certifications"]["bis"] = {}
    monkeypatch.setattr(mp, "get_vendor_by_gstin", lambda g: vendor if g == clean_vendor_db["gstin"] else None)

    result = cv.verify_certificates(bid, tender_requirements=clean_vendor_db["tender"], as_of=REFERENCE_DATE)
    check = next(c for c in result["checks"] if c["check"] == "bis_certificate_on_file")
    assert check["status"] == cv.FAIL
    assert result["overall_status"] == cv.FAIL


def test_missing_non_mandatory_certificate_record_is_info_only(clean_vendor_db, monkeypatch):
    bid = _matching_bid(clean_vendor_db["gstin"], clean_vendor_db["vendor"])
    vendor = copy.deepcopy(clean_vendor_db["vendor"])
    vendor["nsic"] = {}
    monkeypatch.setattr(mp, "get_vendor_by_gstin", lambda g: vendor if g == clean_vendor_db["gstin"] else None)

    result = cv.verify_certificates(bid, tender_requirements=clean_vendor_db["tender"], as_of=REFERENCE_DATE)
    check = next(c for c in result["checks"] if c["check"] == "nsic_certificate_on_file")
    assert check["status"] == cv.INFO
    assert result["overall_status"] == cv.PASS


# ---------------------------------------------------------
# Unrecognized mandatory certification labels
# ---------------------------------------------------------

def test_unrecognized_mandatory_label_is_surfaced_not_dropped(clean_vendor_db):
    tender = {"mandatory_certifications": ["BIS", "CE MARKING"]}
    bid = _matching_bid(clean_vendor_db["gstin"], clean_vendor_db["vendor"])
    result = cv.verify_certificates(bid, tender_requirements=tender, as_of=REFERENCE_DATE)
    flagged = [c for c in result["checks"] if c["check"] == "mandatory_certification_recognized"]
    assert len(flagged) == 1
    assert flagged[0]["status"] == cv.WARNING
    assert flagged[0]["declared"] == "CE MARKING"


# ---------------------------------------------------------
# verify_all
# ---------------------------------------------------------

def test_verify_all_runs_every_bid(clean_vendor_db):
    bids = [
        _matching_bid(clean_vendor_db["gstin"], clean_vendor_db["vendor"], source_file="a.pdf"),
        {"source_file": "b.pdf", "fields": {}},
    ]
    results = cv.verify_all(bids, tender_requirements=clean_vendor_db["tender"])
    assert len(results) == 2
    assert results[0]["source_file"] == "a.pdf"
    assert results[1]["overall_status"] == cv.CRITICAL


# ---------------------------------------------------------
# Regression tests against the REAL shipped dataset
# ---------------------------------------------------------
# These intentionally do NOT monkeypatch DB_PATH, pinning this module's
# behaviour to the scenarios dummy_records.json's own `_meta.vendor_scenarios`
# documents. If either file changes in a way that breaks this alignment,
# these tests catch it immediately rather than in a live demo.

def _bid_for_shipped_vendor(gstin: str) -> dict:
    vendor = mp.get_vendor_by_gstin(gstin)
    return {
        "source_file": f"{gstin}.pdf",
        "fields": {
            "gstin": gstin,
            "bis_certificate_number": vendor["certifications"]["bis"]["certificate_number"],
            "iso_9001_certificate_number": vendor["certifications"]["iso_9001"]["certificate_number"],
            "nsic_certificate_number": vendor.get("nsic", {}).get("certificate_number"),
        },
    }


def test_shipped_dataset_fully_compliant_vendor_passes():
    """07AAACA1234K1Z2 per _meta.vendor_scenarios: 'Fully compliant vendor'."""
    tender = mp.get_tender_requirements()
    bid = _bid_for_shipped_vendor("07AAACA1234K1Z2")
    result = cv.verify_certificates(bid, tender_requirements=tender)
    assert result["overall_status"] == cv.PASS


def test_shipped_dataset_expired_iso_vendor_fails_on_iso_only():
    """19AAAEE7777P1Z5 per _meta.vendor_scenarios: 'Compliant but ISO 9001
    certificate expired.' - BIS must still PASS; only ISO 9001 should FAIL."""
    tender = mp.get_tender_requirements()
    bid = _bid_for_shipped_vendor("19AAAEE7777P1Z5")
    result = cv.verify_certificates(bid, tender_requirements=tender)
    assert result["overall_status"] == cv.FAIL

    bis_expiry = next(c for c in result["checks"] if c["check"] == "bis_not_expired")
    iso_expiry = next(c for c in result["checks"] if c["check"] == "iso_9001_not_expired")
    assert bis_expiry["status"] == cv.PASS
    assert iso_expiry["status"] == cv.FAIL


def test_shipped_dataset_debarred_vendor_fails_both_mandatory_certs():
    """06AACCC9999M1Z4 has a Revoked/expired BIS cert and an Expired ISO
    9001 cert - both mandatory, so both must FAIL."""
    tender = mp.get_tender_requirements()
    bid = _bid_for_shipped_vendor("06AACCC9999M1Z4")
    result = cv.verify_certificates(bid, tender_requirements=tender)
    assert result["overall_status"] == cv.FAIL

    bis_expiry = next(c for c in result["checks"] if c["check"] == "bis_not_expired")
    iso_expiry = next(c for c in result["checks"] if c["check"] == "iso_9001_not_expired")
    assert bis_expiry["status"] == cv.FAIL
    assert iso_expiry["status"] == cv.FAIL


def test_shipped_dataset_all_other_vendors_pass():
    """The remaining vendors' documented scenarios (suspended GST,
    cancelled GST, low turnover, low local content) are all about things
    OTHER than certificates - their BIS/ISO 9001 records are valid, so
    cert_verifier alone should report PASS for each."""
    tender = mp.get_tender_requirements()
    for gstin in ("27AABCB5678L1Z9", "33AAACD4444N1Z1", "24AAAFG8888Q1Z6"):
        bid = _bid_for_shipped_vendor(gstin)
        result = cv.verify_certificates(bid, tender_requirements=tender)
        assert result["overall_status"] == cv.PASS, f"{gstin}: {result}"