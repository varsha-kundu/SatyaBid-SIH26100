"""
SIH GeM Bid Compliance Platform (PS ID: 26100)
Step 1 - Unified Flask REST API Gateway
---------------------------------------------------------
Exposes all 12 statutory government portals + OEM Authorization,
dataset integrity checks, tender requirements, and pre-verification.

Also exposes vendor_verifier.py's identity/mismatch engine via
POST /verify-bid (see below), so a submitted bid's extracted fields can be
cross-checked against the portal registry over HTTP, not just from the CLI.
"""

import hmac
import logging
import os
from typing import Optional
from dotenv import load_dotenv
from flask import Flask, jsonify, request, make_response
from services.verification import mock_portals as mp
from services.verification.vendor_verifier import verify_vendor
from services.verification.tender_verifier import verify_tender_eligibility
from services.ai.compliance_engine import evaluate_bid

load_dotenv()  # loads API_KEY (and any other secrets) from a local .env file if present

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

_DEFAULT_DEV_KEY = "SIH2026"
API_KEY = os.getenv("API_KEY", _DEFAULT_DEV_KEY)

if API_KEY == _DEFAULT_DEV_KEY or API_KEY == "REPLACE_WITH_REAL_SECRET_KEY":
    logger.warning(
        "API_KEY is not set to a non-default value - falling back to the default "
        "demo key. Remove any real keys from the repo and set a secure API_KEY "
        "in your environment or a local .env file. See .env.example."
    )

app = Flask(__name__)

# ---------------------------------------------------------
# Security & CORS Middleware
# ---------------------------------------------------------

@app.before_request
def verify_api_key():
    # Skip for OPTIONS preflight and health/open routes and docs
    if request.method == "OPTIONS" or request.endpoint in ("health", "openapi_spec", "swagger_ui"):
        return

    key = request.headers.get("X-API-KEY")
    if not key or not hmac.compare_digest(key, API_KEY):
        return jsonify({
            "error": "Unauthorized",
            "message": "Missing or invalid X-API-KEY header"
        }), 401


def _get_allowed_origins() -> list[str]:
    """Return the list of allowed CORS origins from the CORS_ORIGINS env var.

    Supports a comma-separated list so multiple origins (e.g. Netlify deploy
    URL + localhost dev server) can be allowed without changing code.
    Falls back to localhost:5173 for local development.
    """
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]


@app.after_request
def add_cors_headers(response):
    # Reflect the methods this specific route actually supports (Flask
    # already computed this correctly for the OPTIONS "Allow" header) rather
    # than hardcoding "GET, OPTIONS" - that hardcoding was fine while every
    # route was GET-only, but /admin/reload-db (POST) needs POST advertised
    # too, or a browser's CORS preflight will block it even though the
    # server would accept the real request.
    allowed_methods = response.headers.get("Allow")
    if not allowed_methods and request.url_rule:
        allowed_methods = ", ".join(sorted(request.url_rule.methods - {"HEAD"}))

    # Echo back the request origin if it is in the allowed list; this is the
    # correct way to handle multiple allowed origins rather than returning a
    # comma-separated list (which browsers do not accept).
    request_origin = request.headers.get("Origin", "")
    allowed_origins = _get_allowed_origins()
    if request_origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = request_origin
    else:
        # Default to the first allowed origin (keeps behaviour unchanged for
        # same-origin or non-browser requests).
        response.headers["Access-Control-Allow-Origin"] = allowed_origins[0]

    response.headers["Access-Control-Allow-Methods"] = allowed_methods or "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-API-KEY"
    response.headers["Access-Control-Max-Age"] = "600"
    response.headers["Vary"] = "Origin"
    return response

# ---------------------------------------------------------
# Helper: Standardized Route Handler with Format Validation
# ---------------------------------------------------------

def _execute_portal_query(identifier: str, validation_fn, query_fn, identifier_type: str):
    if not identifier or not identifier.strip():
        return jsonify({
            "lookup_status": "INVALID_INPUT",
            "message": f"{identifier_type} must not be empty."
        }), 400

    clean_id = identifier.strip().upper()
    if validation_fn and not validation_fn(clean_id):
        return jsonify({
            "lookup_status": "INVALID_FORMAT",
            "message": f"'{identifier}' is not a valid {identifier_type} format."
        }), 400

    try:
        data = query_fn(clean_id)
    except (FileNotFoundError, ValueError) as exc:
        return jsonify({
            "lookup_status": "SERVICE_UNAVAILABLE",
            "message": "Government portal database is unavailable.",
            "detail": str(exc)
        }), 503
    except Exception as exc:
        logger.exception("Unexpected error while querying portal")
        return jsonify({
            "lookup_status": "INTERNAL_ERROR",
            "message": "An unexpected error occurred.",
            "detail": str(exc)
        }), 500

    if isinstance(data, dict) and data.get("lookup_status") == "NOT_FOUND":
        return jsonify(data), 404

    if data is None:
        # explicit not found for portal simulators that return None
        return jsonify({"lookup_status": "NOT_FOUND", "message": "Not found", "identifier": identifier}), 404

    return jsonify(data), 200


def _parse_extracted_bid_body() -> tuple[Optional[dict], Optional[tuple]]:
    """Shared request-body parsing for every route that accepts an
    extractor.py-shaped bid ({"source_file": ..., "fields": {...}}).
    Returns (extracted_bid, None) on success, or (None, (response, code))
    on validation failure, so a route can just do:

        extracted_bid, error = _parse_extracted_bid_body()
        if error:
            return error

    Factored out once here instead of copy-pasted across /verify-bid,
    /verify-tender and /verify-compliance, which all previously
    duplicated the exact same four checks.
    """
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return None, (jsonify({
            "error": "Invalid request",
            "message": "Request body must be JSON with a top-level 'fields' object."
        }), 400)

    fields = body.get("fields")
    if not isinstance(fields, dict) or not fields:
        return None, (jsonify({
            "error": "Invalid request",
            "message": "'fields' must be a non-empty JSON object with the bid's extracted values."
        }), 400)

    return {
        "source_file": body.get("source_file", "<submitted via API>"),
        "fields": fields,
    }, None


# ---------------------------------------------------------
# 12 Statutory Government Portal Endpoints
# ---------------------------------------------------------

@app.route("/gst/<gstin>", methods=["GET"])
def get_gst(gstin):
    return _execute_portal_query(gstin, mp.is_valid_gstin, mp.query_gst_portal, "GSTIN")


@app.route("/pan/<pan>", methods=["GET"])
def get_pan(pan):
    return _execute_portal_query(pan, mp.is_valid_pan, mp.query_pan_portal, "PAN")


@app.route("/cin/<cin>", methods=["GET"])
def get_cin(cin):
    return _execute_portal_query(cin, mp.is_valid_cin, mp.query_mca_portal, "CIN")


@app.route("/udyam/<udyam_id>", methods=["GET"])
def get_udyam(udyam_id):
    return _execute_portal_query(udyam_id, mp.is_valid_udyam, mp.query_udyam_portal, "Udyam ID")


@app.route("/startup/<startup_id>", methods=["GET"])
def get_startup(startup_id):
    return _execute_portal_query(startup_id, mp.is_valid_startup, mp.query_startup_india_portal, "Startup ID")


@app.route("/nsic/<nsic_id>", methods=["GET"])
def get_nsic(nsic_id):
    return _execute_portal_query(nsic_id, mp.is_valid_nsic, mp.query_nsic_portal, "NSIC ID")


@app.route("/epfo/<epfo_id>", methods=["GET"])
def get_epfo(epfo_id):
    return _execute_portal_query(epfo_id, mp.is_valid_epfo, mp.query_epfo_portal, "EPFO ID")


@app.route("/esic/<esic_id>", methods=["GET"])
def get_esic(esic_id):
    return _execute_portal_query(esic_id, mp.is_valid_esic, mp.query_esic_portal, "ESIC ID")


@app.route("/digilocker/<digilocker_id>", methods=["GET"])
def get_digilocker(digilocker_id):
    return _execute_portal_query(digilocker_id, mp.is_valid_digilocker, mp.query_digilocker_portal, "DigiLocker ID")


@app.route("/make-in-india/<make_in_india_id>", methods=["GET"])
def get_make_in_india(make_in_india_id):
    return _execute_portal_query(make_in_india_id, mp.is_valid_make_in_india, mp.query_make_in_india_portal, "Make in India ID")


@app.route("/certifications/<path:certification_id>", methods=["GET"])
def get_certifications(certification_id):
    return _execute_portal_query(certification_id, mp.is_valid_certification, mp.query_certifications_portal, "Certification ID")


@app.route("/debarment/<debarment_id>", methods=["GET"])
def get_debarment(debarment_id):
    return _execute_portal_query(debarment_id, mp.is_valid_debarment, mp.query_debarment_registry, "Debarment ID")


# ---------------------------------------------------------
# OEM Authorization Endpoint
# ---------------------------------------------------------

@app.route("/oem/<gstin>", methods=["GET"])
def get_oem(gstin):
    return _execute_portal_query(gstin, mp.is_valid_gstin, mp.query_oem_authorization, "GSTIN")


# ---------------------------------------------------------
# Combined Vendor Lookups & System Endpoints
# ---------------------------------------------------------

@app.route("/vendor/<identifier>", methods=["GET"])
@app.route("/lookup/<identifier>", methods=["GET"])
def lookup(identifier):
    try:
        resp = mp.get_raw_portal_response(identifier)
    except (FileNotFoundError, ValueError) as exc:
        return jsonify({
            "lookup_status": "SERVICE_UNAVAILABLE",
            "message": "Database unavailable.",
            "detail": str(exc)
        }), 503

    status_map = {
        "FOUND": 200,
        "NOT_FOUND": 404,
        "INVALID_INPUT": 400,
        "INVALID_FORMAT": 400,
    }
    return jsonify(resp), status_map.get(resp.get("lookup_status", ""), 200)


@app.route("/pre-verify/<gstin>", methods=["GET"])
def pre_verify(gstin):
    if not mp.is_valid_gstin(gstin):
        return jsonify({"error": f"'{gstin}' is not a valid GSTIN format."}), 400

    report = mp.generate_preverification_report(gstin)
    if not report:
        return jsonify({"error": "Vendor not found"}), 404
    return jsonify(report), 200


@app.route("/verify-bid", methods=["POST"])
def verify_bid():
    """Cross-checks one extracted bid's self-declared fields against the
    government portal registry via vendor_verifier.verify_vendor().

    Expects a JSON body shaped like extractor.py's per-bid output:
        {
          "source_file": "bid_form_bid_apx_2026_089.pdf",
          "fields": {
            "gstin": "07AAACA1234K1Z2",
            "pan": "AAACA1234K",
            "cin": "U28112DL2019PTC345123",
            "legal_name": "Apex Industrial Pipes Pvt Ltd",
            "udyam_msme_registered": "Yes",
            "udyam_registration_number": "UDYAM-DL-01-0045678",
            "startup_india_dpiit_recognized": "Yes",
            "msme_exemption_claimed": "Yes"
          }
        }
    "fields" is the only required key; "source_file" is optional and only
    used for labeling the response.
    """
    extracted_bid, error = _parse_extracted_bid_body()
    if error:
        return error

    try:
        result = verify_vendor(extracted_bid)
    except (FileNotFoundError, ValueError) as exc:
        return jsonify({
            "lookup_status": "SERVICE_UNAVAILABLE",
            "message": "Government portal database is unavailable.",
            "detail": str(exc)
        }), 503
    except Exception as exc:
        logger.exception("Unexpected error while verifying bid")
        return jsonify({
            "lookup_status": "INTERNAL_ERROR",
            "message": "An unexpected error occurred.",
            "detail": str(exc)
        }), 500

    return jsonify(result), 200


@app.route("/verify-tender", methods=["POST"])
def verify_tender():
    """Cross-checks one extracted bid's verified portal data against this
    tender's specific eligibility thresholds (turnover, local content,
    mandatory certifications) via tender_verifier.verify_tender_eligibility().

    Same request body shape as /verify-bid - see that route's docstring.
    """
    extracted_bid, error = _parse_extracted_bid_body()
    if error:
        return error

    try:
        result = verify_tender_eligibility(extracted_bid)
    except (FileNotFoundError, ValueError) as exc:
        return jsonify({
            "lookup_status": "SERVICE_UNAVAILABLE",
            "message": "Government portal database is unavailable.",
            "detail": str(exc)
        }), 503
    except Exception as exc:
        logger.exception("Unexpected error while verifying tender eligibility")
        return jsonify({
            "lookup_status": "INTERNAL_ERROR",
            "message": "An unexpected error occurred.",
            "detail": str(exc)
        }), 500

    return jsonify(result), 200


@app.route("/verify-compliance", methods=["POST"])
def verify_compliance():
    """Runs the full unified AI Verification Engine (vendor identity +
    tender eligibility + mandatory certifications, merged into one
    Compliance Report) via compliance_engine.evaluate_bid().

    This is what a Compliance Dashboard should call for a single bid:
    it returns one overall_status, one compliance_score (0-100), one
    risk_level, a category-level breakdown, a plain-English AI
    recommendation, and a SHA-256 integrity_hash for the audit trail -
    instead of a caller having to hit /verify-bid, /verify-tender and
    a hypothetical /verify-certs separately and reconcile three
    outputs itself.

    Same request body shape as /verify-bid - see that route's docstring.
    The final qualify/disqualify decision always rests with the
    Procurement Officer; this endpoint is decision-support only.
    """
    extracted_bid, error = _parse_extracted_bid_body()
    if error:
        return error

    try:
        result = evaluate_bid(extracted_bid)
    except (FileNotFoundError, ValueError) as exc:
        return jsonify({
            "lookup_status": "SERVICE_UNAVAILABLE",
            "message": "Government portal database is unavailable.",
            "detail": str(exc)
        }), 503
    except Exception as exc:
        logger.exception("Unexpected error while evaluating compliance")
        return jsonify({
            "lookup_status": "INTERNAL_ERROR",
            "message": "An unexpected error occurred.",
            "detail": str(exc)
        }), 500

    return jsonify(result), 200


@app.route("/vendors", methods=["GET"])
def list_vendors():
    try:
        vendors = mp.list_vendor_identifiers()
    except (FileNotFoundError, ValueError) as exc:
        return jsonify({"lookup_status": "SERVICE_UNAVAILABLE", "detail": str(exc)}), 503
    return jsonify({"count": len(vendors), "vendors": vendors}), 200


@app.route("/tender-requirements", methods=["GET"])
def tender_requirements():
    try:
        reqs = mp.get_tender_requirements()
    except (FileNotFoundError, ValueError) as exc:
        return jsonify({"lookup_status": "SERVICE_UNAVAILABLE", "detail": str(exc)}), 503
    return jsonify(reqs), 200


@app.route("/verify", methods=["GET"])
def verify_integrity():
    try:
        issues = mp.verify_database_integrity()
    except (FileNotFoundError, ValueError) as exc:
        return jsonify({"lookup_status": "SERVICE_UNAVAILABLE", "detail": str(exc)}), 503
    return jsonify({"issue_count": len(issues), "issues": issues}), 200


@app.route("/extract", methods=["POST"])
def extract_bid():
    """OCR-extract fields from a named sample bid PDF.

    Accepts either:
      { "source_file": "bid_form_bid_apx_2026_089.pdf" }   — loads from dummy_dataset/sample_bids/
      multipart/form-data with a "file" field              — uses uploaded PDF bytes

    Returns:
      { "source_file": str, "entities": {...}, "confidence": int,
        "text_length": int, "fields": {...} }

    The "fields" key maps entity data into the format expected by
    /verify-compliance so the frontend can pre-populate the form without
    manual input.
    """
    import os
    import tempfile
    from pathlib import Path
    from services.ai.extractor import DocumentExtractor

    extractor = DocumentExtractor()

    # --- Resolve the PDF path ---
    pdf_path: str | None = None
    tmp_path: str | None = None

    if request.content_type and "multipart/form-data" in request.content_type:
        # Uploaded file
        uploaded = request.files.get("file")
        if not uploaded:
            return jsonify({"error": "No file uploaded."}), 400
        if not uploaded.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Only PDF files are supported."}), 400
        try:
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
            uploaded.save(tmp.name)
            pdf_path = tmp.name
            tmp_path = tmp.name
        except Exception as exc:
            return jsonify({"error": f"Failed to save uploaded file: {exc}"}), 500
    else:
        # JSON body with source_file name
        body = request.get_json(silent=True) or {}
        source_file = body.get("source_file", "")
        if not source_file:
            return jsonify({"error": "source_file is required."}), 400
        base_dir = Path(__file__).parent / "dummy_dataset" / "sample_bids"
        candidate = (base_dir / source_file).resolve()
        # Security: ensure the resolved path stays inside sample_bids
        try:
            candidate.relative_to(base_dir.resolve())
        except ValueError:
            return jsonify({"error": "Invalid source_file path."}), 400
        if not candidate.exists():
            return jsonify({"error": f"File not found: {source_file}"}), 404
        pdf_path = str(candidate)

    try:
        result = extractor.process_pdf(pdf_path)
    except Exception as exc:
        logger.exception("PDF extraction failed")
        return jsonify({"error": f"Extraction failed: {exc}"}), 500
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    # Map entities → fields shape expected by /verify-compliance
    entities = result.get("entities", {})

    def first(lst: list) -> str:
        return lst[0] if lst else ""

    fields = {
        "gstin": first(entities.get("gstin", [])),
        "pan":   first(entities.get("pan", [])),
        "cin":   first(entities.get("cin", [])),
        "udyam_registration_number": first(entities.get("udyam", [])),
        "legal_name": "",   # regex patterns don't extract legal names — needs NER
        "udyam_msme_registered": "Yes" if entities.get("udyam") else "No",
        "startup_india_dpiit_recognized": "No",
        "msme_exemption_claimed": "No",
    }

    return jsonify({
        "source_file": result["file_name"],
        "entities": entities,
        "confidence": result["confidence"],
        "text_length": result["text_length"],
        "fields": fields,
        "note": (
            "Fields derived from regex extraction only. Legal name and declarations "
            "require NER models not yet wired in the prototype. Verify before submitting."
        ),
    }), 200


@app.route("/health", methods=["GET"])
def health():
    try:
        mp.load_database()
    except (FileNotFoundError, ValueError) as exc:
        return jsonify({"status": "degraded", "detail": str(exc)}), 503
    return jsonify({"status": "ok"}), 200


# ---------------------------------------------------------
# Admin helper: force-reload DB (authenticated)
# ---------------------------------------------------------
@app.route("/admin/reload-db", methods=["POST"])
def admin_reload_db():
    # Protected by the API key via before_request
    try:
        mp.load_database(force_reload=True)
        return jsonify({"status": "reloaded"}), 200
    except Exception as exc:
        logger.exception("Failed to reload database")
        return jsonify({"status": "error", "detail": str(exc)}), 500


# ---------------------------------------------------------
# OpenAPI & Swagger UI (lightweight)
# ---------------------------------------------------------
def _build_openapi_spec() -> dict:
    """Minimal OpenAPI spec describing key endpoints for interactive testing."""
    spec = {
        "openapi": "3.0.3",
        "info": {
            "title": "SIH GeM Mock Portal API (Step 1)",
            "version": "1.0.0",
            "description": "Mock government portal and lookup API for SIH 2026 Step 1"
        },
        "servers": [{"url": "/"}],
        "paths": {
            "/gst/{gstin}": {
                "get": {
                    "summary": "Query GST portal by GSTIN",
                    "parameters": [
                        {"name": "gstin", "in": "path", "required": True, "schema": {"type": "string"}}
                    ],
                    "responses": {
                        "200": {"description": "GST record found"},
                        "400": {"description": "Invalid input/format"},
                        "401": {"description": "Unauthorized"},
                        "404": {"description": "Not found"},
                    },
                    "security": [{"ApiKeyAuth": []}],
                }
            },
            "/vendor/{identifier}": {
                "get": {
                    "summary": "Unified vendor lookup by GSTIN/PAN/CIN",
                    "parameters": [
                        {"name": "identifier", "in": "path", "required": True, "schema": {"type": "string"}}
                    ],
                    "responses": {"200": {"description": "Found / Not Found"}},
                    "security": [{"ApiKeyAuth": []}],
                }
            },
            "/pre-verify/{gstin}": {
                "get": {
                    "summary": "Pre-verification report for GSTIN",
                    "parameters": [{"name": "gstin", "in": "path", "required": True, "schema": {"type": "string"}}],
                    "responses": {"200": {"description": "Report"}, "404": {"description": "Not found"}},
                    "security": [{"ApiKeyAuth": []}],
                }
            },
            "/verify-bid": {
                "post": {
                    "summary": "Cross-check an extracted bid's declared identity against the portal registry",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": ["fields"],
                                    "properties": {
                                        "source_file": {"type": "string"},
                                        "fields": {"type": "object"},
                                    },
                                }
                            }
                        },
                    },
                    "responses": {
                        "200": {"description": "Verification result (overall_status + per-check breakdown)"},
                        "400": {"description": "Invalid/missing fields"},
                    },
                    "security": [{"ApiKeyAuth": []}],
                }
            },
            "/verify-tender": {
                "post": {
                    "summary": "Cross-check a verified vendor's portal data against this tender's "
                               "eligibility thresholds (turnover, local content, mandatory certifications)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": ["fields"],
                                    "properties": {
                                        "source_file": {"type": "string"},
                                        "fields": {"type": "object"},
                                    },
                                }
                            }
                        },
                    },
                    "responses": {
                        "200": {"description": "Eligibility result (overall_status + per-check breakdown)"},
                        "400": {"description": "Invalid/missing fields"},
                    },
                    "security": [{"ApiKeyAuth": []}],
                }
            },
            "/verify-compliance": {
                "post": {
                    "summary": "Run the full unified AI Verification Engine (identity + tender "
                               "eligibility + certifications) and return one Compliance Report "
                               "with an overall score, risk level, and recommendation",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": ["fields"],
                                    "properties": {
                                        "source_file": {"type": "string"},
                                        "fields": {"type": "object"},
                                    },
                                }
                            }
                        },
                    },
                    "responses": {
                        "200": {"description": "Compliance report (overall_status, compliance_score, "
                                                "risk_level, categories, recommendation, integrity_hash)"},
                        "400": {"description": "Invalid/missing fields"},
                    },
                    "security": [{"ApiKeyAuth": []}],
                }
            },
            "/health": {
                "get": {
                    "summary": "Service health",
                    "responses": {"200": {"description": "OK"}, "503": {"description": "Degraded"}},
                }
            },
            "/admin/reload-db": {
                "post": {
                    "summary": "Force reload database (authenticated)",
                    "responses": {"200": {"description": "Reloaded"}},
                    "security": [{"ApiKeyAuth": []}],
                }
            }
        },
        "components": {
            "securitySchemes": {
                "ApiKeyAuth": {
                    "type": "apiKey",
                    "in": "header",
                    "name": "X-API-KEY"
                }
            }
        }
    }
    return spec


@app.route("/openapi.json", methods=["GET"])
def openapi_spec():
    return jsonify(_build_openapi_spec())


@app.route("/docs", methods=["GET"])
def swagger_ui():
    # Serve a tiny Swagger UI page using the swagger-ui-dist bundle via CDN.
    html = (
        "<!DOCTYPE html>"
        "<html><head><meta charset='UTF-8'/>"
        "<title>SIH GeM Mock Portal API Docs</title>"
        "<link rel='stylesheet' href='https://unpkg.com/swagger-ui-dist@4/swagger-ui.css'/>"
        "<style>body{margin:0;padding:0;}</style></head>"
        "<body><div id='swagger-ui'></div>"
        "<script src='https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js'></script>"
        "<script>"
        "window.onload = function() {"
        "const ui = SwaggerUIBundle({url: '/openapi.json', dom_id: '#swagger-ui', presets: [SwaggerUIBundle.presets.apis], layout: 'BaseLayout'});"
        "window.ui = ui;"
        "};"
        "</script></body></html>"
    )
    resp = make_response(html)
    resp.headers["Content-Type"] = "text/html"
    return resp


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "1") == "1"
    run_port = int(os.getenv("PORT", "8000"))

    if debug_mode:
        logger.warning(
            "Running with debug=True (Flask's interactive debugger and "
            "reloader are active). Fine for local development and judging; "
            "set FLASK_DEBUG=0 in .env before deploying anywhere public."
        )

    app.run(debug=debug_mode, port=run_port)