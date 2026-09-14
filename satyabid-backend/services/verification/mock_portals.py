"""
SIH GeM Bid Compliance Platform
Step 1 - Mock Government Portal & API Integration Layer
---------------------------------------------------------

Simulates the government-portal aggregation layer (GST, MCA21,
PAN/Income Tax, EPFO/ESIC, Udyam, Debarment Registry, etc.) using a
local synthetic JSON dataset, since real government APIs are
restricted and not accessible during a hackathon.

This module ONLY answers "does this vendor exist, and what does the
raw portal data say about them?". It deliberately does NOT perform
any compliance evaluation (e.g. "is GST filing overdue?", "is the
vendor blacklisted?") - that logic belongs to Step 2, which will
consume the raw records returned here.
"""

from __future__ import annotations

import json
import logging
import re
import sys
from pathlib import Path
from typing import Any, Optional
from datetime import datetime


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASET_DIR = BASE_DIR / "dummy_dataset"
DB_PATH = DATASET_DIR / "dummy_records.json"
SAMPLE_BIDS_DIR = DATASET_DIR / "sample_bids"

EXPECTED_VENDOR_SECTIONS = ("gstn", "pan_it", "mca21", "debarment_registry")

GST_STATE_CODES = {
    "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
    "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
    "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
    "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam",
    "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
    "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra",
    "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala",
    "33": "Tamil Nadu", "34": "Puducherry",
    "35": "Andaman and Nicobar Islands", "36": "Telangana",
    "37": "Andhra Pradesh", "38": "Ladakh",
}

CIN_STATE_ABBREVIATIONS = {
    "DL": "Delhi", "MH": "Maharashtra", "HR": "Haryana",
    "TN": "Tamil Nadu", "WB": "West Bengal", "GJ": "Gujarat",
    "KA": "Karnataka", "UP": "Uttar Pradesh", "RJ": "Rajasthan",
    "MP": "Madhya Pradesh", "KL": "Kerala", "PB": "Punjab",
    "TG": "Telangana", "AP": "Andhra Pradesh", "BR": "Bihar",
    "OR": "Odisha", "AS": "Assam", "JH": "Jharkhand", "CG": "Chhattisgarh",
    "UT": "Uttarakhand", "GA": "Goa", "CH": "Chandigarh",
    "JK": "Jammu and Kashmir", "HP": "Himachal Pradesh",
}

# Regex compilation
GSTIN_PATTERN = re.compile(r"^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$")
PAN_PATTERN = re.compile(r"^[A-Z]{5}\d{4}[A-Z]$")
CIN_PATTERN = re.compile(r"^[A-Z]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$")
UDYAM_PATTERN = re.compile(r"^UDYAM-[A-Z]{2}-\d{2}-\d{7}$")
EPFO_PATTERN = re.compile(r"^[A-Z]{2}[A-Z]{3}\d{7}\d{3}\d{7}$")
ESIC_PATTERN = re.compile(r"^\d{17}$")


# ---------------------------------------------------------
# Normalization Helper
# ---------------------------------------------------------

def normalize(identifier: str) -> str:
    return identifier.strip().upper() if isinstance(identifier, str) else ""

# Backward compatibility alias
_normalize = normalize


# ---------------------------------------------------------
# Database Loader (cached - reads disk only once per process)
# ---------------------------------------------------------

_database_cache: Optional[dict] = None
_database: Optional[dict] = None
_pan_index: Optional[dict] = None
_cin_index: Optional[dict] = None


def load_database(force_reload: bool = False) -> dict:
    global _database_cache, _database, _pan_index, _cin_index

    if _database_cache is not None and not force_reload:
        if _database is None:
            _database = {
                "government_portals": _database_cache.get("government_portals", {}),
                "tender_requirements": _database_cache.get("tender_requirements", {}),
                "vendors": _database_cache.get("government_portals", {}),
            }
        return _database_cache

    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database file not found: {DB_PATH}")

    try:
        with DB_PATH.open("r", encoding="utf-8") as file:
            _database_cache = json.load(file)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Invalid JSON in database file: {DB_PATH}\nDetails: {exc}"
        ) from exc

    _database = {
        "government_portals": _database_cache.get("government_portals", {}),
        "tender_requirements": _database_cache.get("tender_requirements", {}),
        "vendors": _database_cache.get("government_portals", {}),
    }

    _pan_index = {}
    _cin_index = {}

    government_portals = _database_cache.get("government_portals", {})

    if not government_portals:
        logger.warning(
            "Database loaded but 'government_portals' is empty or missing."
        )

    for gstin, vendor in government_portals.items():
        _validate_vendor_schema(gstin, vendor)

        pan = vendor.get("pan_it", {}).get("pan")
        if pan:
            pan = pan.strip().upper()
            if pan in _pan_index and _pan_index[pan] is not vendor:
                logger.warning(
                    "Duplicate PAN '%s' found on GSTIN '%s' - indexed record shadowed.",
                    pan, gstin
                )
            _pan_index[pan] = vendor

        cin = vendor.get("mca21", {}).get("cin")
        if cin:
            cin = cin.strip().upper()
            if cin in _cin_index and _cin_index[cin] is not vendor:
                logger.warning(
                    "Duplicate CIN '%s' found on GSTIN '%s' - indexed record shadowed.",
                    cin, gstin
                )
            _cin_index[cin] = vendor

    return _database_cache


def _validate_vendor_schema(gstin: str, vendor: dict) -> None:
    missing = [
        section
        for section in EXPECTED_VENDOR_SECTIONS
        if section not in vendor
    ]
    if missing:
        logger.warning(
            "Vendor record for GSTIN '%s' is missing expected section(s): %s.",
            gstin, ", ".join(missing)
        )


def _get_pan_index() -> dict:
    if _pan_index is None:
        load_database()
    return _pan_index


def _get_cin_index() -> dict:
    if _cin_index is None:
        load_database()
    return _cin_index


# ---------------------------------------------------------
# Identifier Validation
# ---------------------------------------------------------

def is_valid_gstin(value: str) -> bool:
    return bool(isinstance(value, str) and GSTIN_PATTERN.match(value.strip().upper()))


def is_valid_pan(value: str) -> bool:
    return bool(isinstance(value, str) and PAN_PATTERN.match(value.strip().upper()))


def is_valid_cin(value: str) -> bool:
    return bool(isinstance(value, str) and CIN_PATTERN.match(value.strip().upper()))


def is_valid_udyam(value: str) -> bool:
    return bool(isinstance(value, str) and UDYAM_PATTERN.match(value.strip().upper()))


def is_valid_startup(value: str) -> bool:
    return bool(isinstance(value, str) and len(value.strip()) >= 5)


def is_valid_nsic(value: str) -> bool:
    return bool(isinstance(value, str) and len(value.strip()) >= 5)


def is_valid_epfo(value: str) -> bool:
    return bool(isinstance(value, str) and (EPFO_PATTERN.match(value.strip().upper()) or len(value.strip()) >= 7))


def is_valid_esic(value: str) -> bool:
    return bool(isinstance(value, str) and (ESIC_PATTERN.match(value.strip()) or len(value.strip()) >= 10))


def is_valid_digilocker(value: str) -> bool:
    return bool(isinstance(value, str) and len(value.strip()) >= 4)


def is_valid_make_in_india(value: str) -> bool:
    return bool(isinstance(value, str) and len(value.strip()) >= 4)


def is_valid_certification(value: str) -> bool:
    return bool(isinstance(value, str) and len(value.strip()) >= 3)


def is_valid_debarment(value: str) -> bool:
    return is_valid_gstin(value) or is_valid_pan(value) or is_valid_cin(value) or (isinstance(value, str) and len(value.strip()) >= 3)


# ---------------------------------------------------------
# Tender Data
# ---------------------------------------------------------

def get_tender_requirements() -> dict:
    database = load_database()
    return database.get("tender_requirements", {})


# ---------------------------------------------------------
# Vendor Lookup
# ---------------------------------------------------------

def get_vendor_by_gstin(gstin: str) -> Optional[dict]:
    if not isinstance(gstin, str):
        return None

    clean_gstin = _normalize(gstin)
    if not clean_gstin:
        return None

    database = load_database()
    return database.get("government_portals", {}).get(clean_gstin)


def get_vendor_by_pan(pan: str) -> Optional[dict]:
    if not isinstance(pan, str):
        return None

    clean_pan = _normalize(pan)
    if not clean_pan:
        return None

    return _get_pan_index().get(clean_pan)


def get_vendor_by_cin(cin: str) -> Optional[dict]:
    if not isinstance(cin, str):
        return None

    clean_cin = _normalize(cin)
    if not clean_cin:
        return None

    return _get_cin_index().get(clean_cin)


def lookup_vendor(identifier: str) -> Optional[dict]:
    if not isinstance(identifier, str):
        return None

    clean_id = _normalize(identifier)
    if not clean_id:
        return None

    if is_valid_gstin(clean_id):
        return get_vendor_by_gstin(clean_id)

    if is_valid_pan(clean_id):
        return get_vendor_by_pan(clean_id)

    if is_valid_cin(clean_id):
        return get_vendor_by_cin(clean_id)

    # General fallback search across all vendors
    for gstin, v in get_all_vendors().items():
        if gstin == clean_id:
            return v
    return None


# ---------------------------------------------------------
# Portal Simulators
# ---------------------------------------------------------

def query_gst_portal(gstin: str) -> Optional[dict]:
    vendor = get_vendor_by_gstin(gstin)
    return vendor.get("gstn") if vendor else None


def query_pan_portal(pan: str) -> Optional[dict]:
    vendor = get_vendor_by_pan(pan)
    return vendor.get("pan_it") if vendor else None


def query_mca_portal(cin: str) -> Optional[dict]:
    vendor = get_vendor_by_cin(cin)
    return vendor.get("mca21") if vendor else None


def query_epfo_portal(epfo_id: str) -> Optional[dict]:
    clean_id = _normalize(epfo_id)
    for vendor in get_all_vendors().values():
        epfo = vendor.get("epfo", {})
        if epfo.get("establishment_id") == clean_id or vendor.get("gstn", {}).get("gstin") == clean_id:
            return epfo
    return None


def query_esic_portal(esic_id: str) -> Optional[dict]:
    clean_id = _normalize(esic_id)
    for vendor in get_all_vendors().values():
        esic = vendor.get("esic", {})
        if esic.get("employer_code") == clean_id or vendor.get("gstn", {}).get("gstin") == clean_id:
            return esic
    return None


def query_debarment_registry(identifier: str) -> Optional[dict]:
    vendor = lookup_vendor(identifier)
    return vendor.get("debarment_registry") if vendor else None


def query_udyam_portal(udyam_id: str) -> Optional[dict]:
    clean_id = _normalize(udyam_id)
    for vendor in get_all_vendors().values():
        udyam = vendor.get("udyam_msme", {})
        if udyam.get("udyam_registration_number") == clean_id or vendor.get("gstn", {}).get("gstin") == clean_id:
            return udyam
    return None


def query_startup_india_portal(startup_id: str) -> Optional[dict]:
    clean_id = _normalize(startup_id)
    for vendor in get_all_vendors().values():
        startup = vendor.get("startup_india", {})
        if startup.get("dpiit_recognition_number") == clean_id or vendor.get("gstn", {}).get("gstin") == clean_id:
            return startup
    return None


def query_nsic_portal(nsic_id: str) -> Optional[dict]:
    clean_id = _normalize(nsic_id)
    for vendor in get_all_vendors().values():
        nsic = vendor.get("nsic", {})
        if nsic.get("certificate_number") == clean_id or vendor.get("gstn", {}).get("gstin") == clean_id:
            return nsic
    return None


def query_digilocker_portal(doc_id: str) -> Optional[dict]:
    clean_id = _normalize(doc_id)
    for vendor in get_all_vendors().values():
        digi = vendor.get("digilocker", {})
        if digi.get("verification_reference") == clean_id or vendor.get("gstn", {}).get("gstin") == clean_id:
            return digi
    return None


def query_make_in_india_portal(mii_id: str) -> Optional[dict]:
    clean_id = _normalize(mii_id)
    for vendor in get_all_vendors().values():
        mii = vendor.get("make_in_india", {})
        if mii.get("declaration_reference") == clean_id or vendor.get("gstn", {}).get("gstin") == clean_id:
            return mii
    return None


def query_certifications_portal(cert_id: str) -> Optional[dict]:
    clean_id = _normalize(cert_id)
    for vendor in get_all_vendors().values():
        certs = vendor.get("certifications", {})
        bis_number = _normalize(certs.get("bis", {}).get("certificate_number", ""))
        iso_number = _normalize(certs.get("iso_9001", {}).get("certificate_number", ""))
        dpiit_ref = _normalize(certs.get("dpiit", {}).get("recognition_reference", ""))
        if (clean_id and clean_id in (bis_number, iso_number, dpiit_ref)) or vendor.get("gstn", {}).get("gstin") == clean_id:
            return certs
    return None


def query_oem_authorization(gstin: str) -> Optional[dict]:
    vendor = get_vendor_by_gstin(gstin)
    return vendor.get("oem_authorization") if vendor else None


# ---------------------------------------------------------
# Vendor Enumeration
# ---------------------------------------------------------

def list_vendor_identifiers() -> list[dict[str, str]]:
    database = load_database()
    government_portals = database.get("government_portals", {})
    identifiers = []

    for gstin, vendor in government_portals.items():
        identifiers.append(
            {
                "official_name": vendor.get("official_name"),
                "gstin": gstin,
                "pan": vendor.get("pan_it", {}).get("pan"),
                "cin": vendor.get("mca21", {}).get("cin"),
            }
        )
    return identifiers


def get_all_vendors() -> dict[str, dict]:
    database = load_database()
    return database.get("government_portals", {})


# ---------------------------------------------------------
# Data Integrity Verification
# ---------------------------------------------------------

def verify_database_integrity() -> list[str]:
    issues: list[str] = []

    global _database_cache, _database
    if _database is not None:
        if "government_portals" in _database:
            government_portals = _database.get("government_portals", {}) or {}
        elif "vendors" in _database:
            government_portals = _database.get("vendors", {}) or {}
        else:
            government_portals = {}
        tender = _database.get("tender_requirements", {}) or {}
    else:
        database = load_database()
        government_portals = database.get("government_portals", {}) or {}
        tender = database.get("tender_requirements", {}) or {}

    if not government_portals:
        issues.append("government_portals: missing or empty dataset")

    if not tender:
        issues.append("tender_requirements: missing")
    else:
        if "tender_id" not in tender:
            issues.append("tender_requirements: missing tender_id")
        if "min_local_content_pct" not in tender:
            issues.append("tender_requirements: missing min_local_content_pct")
        else:
            pct = tender["min_local_content_pct"]
            if not isinstance(pct, (int, float)) or not (0 <= pct <= 100):
                issues.append("tender_requirements: min_local_content_pct invalid (must be 0-100)")

        if "max_local_content_pct" in tender:
            maxpct = tender["max_local_content_pct"]
            if not isinstance(maxpct, (int, float)) or not (0 <= maxpct <= 100):
                issues.append("tender_requirements: max_local_content_pct invalid (must be 0-100)")

    try:
        with DB_PATH.open("r", encoding="utf-8") as fh:
            original_db = json.load(fh)
    except Exception:
        original_db = None

    if original_db is not None:
        original_tender = original_db.get("tender_requirements", {}) or {}
        for key in set(tender.keys()) - set(original_tender.keys()):
            issues.append(f"tender_requirements: unexpected key '{key}'")
        for key in set(original_tender.keys()) - set(tender.keys()):
            issues.append(f"tender_requirements: missing key '{key}'")
        for key in set(original_tender.keys()).intersection(set(tender.keys())):
            if original_tender.get(key) != tender.get(key):
                issues.append(f"tender_requirements: '{key}' differs from source file (on-disk vs in-memory)")

        original_gov = original_db.get("government_portals", {}) or original_db.get("vendors", {}) or {}
        missing_gstins = set(original_gov.keys()) - set(government_portals.keys())
        for gstin in missing_gstins:
            issues.append(f"{gstin}: vendor record missing from dataset")
        extra_gstins = set(government_portals.keys()) - set(original_gov.keys())
        for gstin in extra_gstins:
            issues.append(f"{gstin}: unexpected vendor record in dataset")

    for gstin, vendor in government_portals.items():
        pan = vendor.get("pan_it", {}).get("pan", "")
        cin = vendor.get("mca21", {}).get("cin", "")
        address = vendor.get("gstn", {}).get("principal_place_of_business", "")

        for sec in EXPECTED_VENDOR_SECTIONS:
            if sec not in vendor:
                issues.append(f"{gstin}: missing section '{sec}'")

        vendor_gstin_field = vendor.get("gstn", {}).get("gstin", "")
        if vendor_gstin_field and vendor_gstin_field != gstin:
            issues.append(
                f"{gstin}: gstn.gstin field '{vendor_gstin_field}' does not match record key '{gstin}'"
            )
        if vendor_gstin_field and not GSTIN_PATTERN.match(vendor_gstin_field):
            issues.append(
                f"{gstin}: gstn.gstin '{vendor_gstin_field}' is not a valid GSTIN format"
            )

        pan_field = vendor.get("pan_it", {}).get("pan", "")
        if pan_field and not PAN_PATTERN.match(pan_field):
            issues.append(f"{gstin}: pan_it.pan '{pan_field}' is not a valid PAN format")

        cin_field = vendor.get("mca21", {}).get("cin", "")
        if cin_field and not CIN_PATTERN.match(cin_field):
            issues.append(f"{gstin}: mca21.cin '{cin_field}' is not a valid CIN format")

        if pan and len(gstin) >= 12 and gstin[2:12] != pan:
            issues.append(
                f"{gstin}: GSTIN embeds PAN '{gstin[2:12]}' but pan_it.pan is '{pan}'"
            )

        expected_state = GST_STATE_CODES.get(gstin[:2])
        if expected_state is None:
            issues.append(f"{gstin}: unrecognized GST state code '{gstin[:2]}'")
        else:
            if expected_state not in address:
                issues.append(
                    f"{gstin}: state code implies '{expected_state}' but principal_place_of_business is '{address}'"
                )

        if cin and len(cin) >= 8:
            cin_state = CIN_STATE_ABBREVIATIONS.get(cin[6:8])
            if cin_state is None:
                issues.append(f"{gstin}: unrecognized CIN state abbreviation '{cin[6:8]}'")
            elif expected_state is not None and cin_state != expected_state:
                issues.append(
                    f"{gstin}: CIN implies state '{cin_state}' but GSTIN implies '{expected_state}'"
                )

        official = vendor.get("official_name", "")
        legal_name = vendor.get("gstn", {}).get("legal_name", "")
        name_on_pan = vendor.get("pan_it", {}).get("name_on_pan", "")
        company_name = vendor.get("mca21", {}).get("company_name", "")

        if official != legal_name:
            issues.append(f"{gstin}: official_name '{official}' != gstn.legal_name '{legal_name}'")
        if official.upper() != name_on_pan.upper():
            issues.append(f"{gstin}: official_name '{official}' != pan_it.name_on_pan '{name_on_pan}'")
        if official != company_name:
            issues.append(f"{gstin}: official_name '{official}' != mca21.company_name '{company_name}'")

        reg_status = vendor.get("gstn", {}).get("registration_status")
        if reg_status is not None and not isinstance(reg_status, str):
            issues.append(
                f"{gstin}: gstn.registration_status has invalid type {type(reg_status).__name__}"
            )
        elif isinstance(reg_status, str):
            expected_values = {"Active", "Suspended", "Cancelled", "Struck Off", "Inactive"}
            if reg_status not in expected_values:
                issues.append(
                    f"{gstin}: gstn.registration_status has unexpected value '{reg_status}'"
                )

    return issues


# ---------------------------------------------------------
# Portal Response & Verification
# ---------------------------------------------------------

def get_raw_portal_response(identifier: str) -> dict[str, Any]:
    if not isinstance(identifier, str) or not identifier.strip():
        return {
            "lookup_status": "INVALID_INPUT",
            "message": "Identifier must be a non-empty string.",
            "identifier": identifier,
            "api_version": "1.0",
            "timestamp": datetime.now().isoformat()
        }

    clean_id = _normalize(identifier)

    if not (
        is_valid_gstin(clean_id)
        or is_valid_pan(clean_id)
        or is_valid_cin(clean_id)
    ):
        return {
            "lookup_status": "INVALID_FORMAT",
            "message": "Identifier format is invalid.",
            "identifier": identifier,
            "api_version": "1.0",
            "timestamp": datetime.now().isoformat()
        }

    vendor = lookup_vendor(clean_id)

    if vendor is None:
        return {
            "lookup_status": "NOT_FOUND",
            "message": "Vendor Not Registered / Unverified Entity",
            "identifier": identifier,
            "api_version": "1.0",
            "timestamp": datetime.now().isoformat(),
            "source": "mock government portal simulator"
        }

    return {
        "lookup_status": "FOUND",
        "identifier": identifier,
        "vendor_data": vendor,
        "api_version": "1.0",
        "timestamp": datetime.now().isoformat(),
        "source": "mock government portal simulator"
    }


def calculate_consistency_score(vendor: dict) -> int:
    if not isinstance(vendor, dict):
        return 0

    score = 100

    gst_name = vendor.get("gstn", {}).get("legal_name", "").upper()
    pan_name = vendor.get("pan_it", {}).get("name_on_pan", "").upper()
    mca_name = vendor.get("mca21", {}).get("company_name", "").upper()

    if gst_name and pan_name and gst_name not in pan_name:
        score -= 30

    if gst_name and mca_name and gst_name not in mca_name:
        score -= 30

    return max(score, 0)


def generate_preverification_report(gstin: str) -> Optional[dict]:
    vendor = get_vendor_by_gstin(gstin)
    if not vendor:
        return None

    return {
        "gst_status": vendor.get("gstn", {}).get("registration_status", "UNKNOWN"),
        "pan_status": vendor.get("pan_it", {}).get("pan_status", "UNKNOWN"),
        "mca_status": vendor.get("mca21", {}).get("company_status", "UNKNOWN"),
        "debarment_status": vendor.get("debarment_registry", {}).get("registry_status", "UNKNOWN"),
        "consistency_score": calculate_consistency_score(vendor)
    }


# ---------------------------------------------------------
# Command-Line Interface
# ---------------------------------------------------------

def _print_header() -> None:
    print("=" * 60)
    print("SIH GEM BID COMPLIANCE PLATFORM")
    print("STEP 1 - MOCK GOVERNMENT PORTAL LOOKUP")
    print("=" * 60)


def _print_response(response: dict) -> None:
    print("\nPortal Response:")
    print("-" * 60)
    print(json.dumps(response, indent=4, ensure_ascii=False))


def main() -> None:
    logging.basicConfig(level=logging.WARNING, format="[%(levelname)s] %(message)s")
    _print_header()

    args = sys.argv[1:]

    try:
        if args and args[0] in ("--list", "-l"):
            vendors = list_vendor_identifiers()
            print(f"\n{len(vendors)} vendor(s) in database:\n")
            for vendor in vendors:
                print(
                    f"  - {vendor['official_name']}\n"
                    f"      GSTIN: {vendor['gstin']}\n"
                    f"      PAN:   {vendor['pan']}\n"
                    f"      CIN:   {vendor['cin']}\n"
                )
            return

        if args and args[0] in ("--verify", "-v"):
            issues = verify_database_integrity()
            if not issues:
                print("\nAll vendor records passed integrity checks.")
            else:
                print(f"\n{len(issues)} integrity issue(s) found:\n")
                for issue in issues:
                    print(f"  - {issue}")
            return

        if args:
            identifier = args[0].strip()
        else:
            identifier = input("\nEnter Vendor GSTIN, PAN, or CIN: ").strip()

        response = get_raw_portal_response(identifier)
        _print_response(response)

    except (FileNotFoundError, ValueError) as exc:
        print("\n[ERROR] Could not load the government portal database.")
        print(f"Details: {exc}")
    except KeyboardInterrupt:
        print("\n\nCancelled.")


if __name__ == "__main__":
    main()