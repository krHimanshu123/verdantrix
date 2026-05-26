from apps.audit.services import create_audit_log
from apps.normalization.models import NormalizedEmissionRecord
from common.constants import ACTION_APPROVE, ACTION_LOCK, ACTION_NOTE, ACTION_REJECT


def execute_review_action(*, record: NormalizedEmissionRecord, user, action: str, analyst_notes: str = ""):
    if record.locked_for_audit:
        raise ValueError("Locked Verdantrix records cannot be modified.")

    old_value = {
        "analyst_status": record.analyst_status,
        "analyst_notes": record.analyst_notes,
        "locked_for_audit": record.locked_for_audit,
    }

    if action == ACTION_APPROVE:
        record.analyst_status = "approved"
    elif action == ACTION_REJECT:
        record.analyst_status = "rejected"
    elif action == ACTION_LOCK:
        record.analyst_status = "locked"
        record.locked_for_audit = True
    elif action != ACTION_NOTE:
        raise ValueError("Unsupported Verdantrix review action.")

    if analyst_notes is not None and analyst_notes != "":
        record.analyst_notes = analyst_notes

    record.save(update_fields=["analyst_status", "analyst_notes", "locked_for_audit", "updated_at"])

    create_audit_log(
        record,
        action_type=action,
        old_value=old_value,
        new_value={
            "analyst_status": record.analyst_status,
            "analyst_notes": record.analyst_notes,
            "locked_for_audit": record.locked_for_audit,
        },
        changed_by=user,
    )
    return record
