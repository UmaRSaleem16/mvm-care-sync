from django.conf import settings


def get_frontend_url(path: str = '') -> str:
    """Build an absolute frontend URL — used in email links."""
    base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173')
    return f"{base.rstrip('/')}/{path.lstrip('/')}"


def is_email_configured() -> bool:
    return bool(settings.EMAIL_HOST_USER or settings.SENDGRID_API_KEY)
