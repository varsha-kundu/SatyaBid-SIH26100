"""
SIH GeM Bid Compliance Platform (PS ID: 26100)
audit/audit_logger.py
---------------------------------------------------------
Append-only JSONL audit logger.

Each log entry contains a timestamp, vendor identifier, action type,
status, and optional details dict. The file is append-only so every
event can be reconstructed and independently verified.

NOTE: In production, entries should also be hashed and stored in a
tamper-evident store (e.g. a database with row-level hash chaining).
For the prototype, appending to a flat JSONL file is sufficient.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

LOG_FILE = Path(__file__).parent / "audit_log.jsonl"


class AuditLogger:
    """Append-only compliance audit logger.

    Usage:
        from audit.audit_logger import audit_logger
        audit_logger.log("07AAACA1234K1Z2", "verify_compliance", "PASS")
        audit_logger.log_event("07AAACA1234K1Z2", "officer_review", "APPROVED",
                               {"reason": "All documents verified", "officer_id": "officer_demo_001"})
    """

    def __init__(self, log_file: Path = LOG_FILE):
        self.log_file = log_file

    def log(self, vendor: str, action: str, status: str, details: dict | None = None) -> dict:
        """Write a single audit event and return the serialized entry."""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "vendor": vendor,
            "action": action,
            "status": status,
            "details": details or {},
        }
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except OSError as exc:
            logger.warning("Audit log write failed: %s", exc)
        return entry

    def log_event(self, vendor: str, event_type: str, status: str, details: dict | None = None) -> dict:
        """Alias for log() — provided for call-site readability."""
        return self.log(vendor, event_type, status, details)

    def read_all(self) -> list[dict]:
        """Return all audit events from the log file (most recent last)."""
        events: list[dict] = []
        if not self.log_file.exists():
            return events
        try:
            with open(self.log_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            events.append(json.loads(line))
                        except json.JSONDecodeError:
                            pass
        except OSError as exc:
            logger.warning("Audit log read failed: %s", exc)
        return events


# Module-level singleton for convenience imports
audit_logger = AuditLogger()
