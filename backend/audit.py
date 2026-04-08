import json
import os
from datetime import datetime, timezone

# Use /tmp on Render (writable), fallback to local for dev
AUDIT_FILE = os.path.join(os.getenv("AUDIT_DIR", "/tmp"), "audit_log.jsonl")


def log_event(event_type: str, application_id: str, payload: dict):
    try:
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "application_id": application_id,
            "payload": payload,
        }
        with open(AUDIT_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception:
        pass  # never crash the app due to audit failure


def get_audit_trail(application_id: str = None) -> list:
    if not os.path.exists(AUDIT_FILE):
        return []
    entries = []
    try:
        with open(AUDIT_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    entry = json.loads(line)
                    if application_id is None or entry.get("application_id") == application_id:
                        entries.append(entry)
    except Exception:
        pass
    return entries
