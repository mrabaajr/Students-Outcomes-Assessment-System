from users.models import AuditLog


def get_actor_from_request(request):
    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        return user
    return None


def build_actor_name(user):
    if not user:
        return "Unknown user"

    full_name = " ".join(part for part in [user.first_name, user.last_name] if part).strip()
    return full_name or user.email or user.username or "Unknown user"


def log_audit_event(request=None, *, user=None, action, target_type, target_name, description, metadata=None):
    actor = user or get_actor_from_request(request)
    AuditLog.objects.create(
        actor=actor,
        actor_name=build_actor_name(actor),
        actor_role=getattr(actor, "role", "") if actor else "",
        action=action,
        target_type=target_type,
        target_name=target_name,
        description=description,
        metadata=metadata or {},
    )
