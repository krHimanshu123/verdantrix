from apps.audit.models import AuditLog


def create_audit_log(emission_record, action_type: str, old_value, new_value, changed_by):
    return AuditLog.objects.create(
        emission_record=emission_record,
        action_type=action_type,
        old_value=old_value,
        new_value=new_value,
        changed_by=changed_by,
    )
