"""
Celery tasks for all outbound notifications:
  - Vendor request email (on submit)
  - Vendor cancellation email (on cancel)
  - Internal team email (on confirm, backup_needed)
  - Teams webhook (all events)
  - Pending reminder sweep (beat schedule)
"""
import logging

import requests as http_requests
from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

logger = logging.getLogger('caresync')


# ── helpers ───────────────────────────────────────────────────────────────

def _log(case, notification_type, status, recipient, subject, body, error='', sent_by=None):
    from apps.notifications.models import NotificationLog
    NotificationLog.objects.create(
        request=case,
        notification_type=notification_type,
        status=status,
        recipient_email=recipient,
        subject=subject,
        body=body,
        error_message=error,
        sent_by_id=sent_by,
    )


def _send_email(to_email, subject, html_body, case, sent_by_id=None):
    from apps.notifications.models import NotificationLog
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send()
        _log(case, NotificationLog.NotificationType.EMAIL, NotificationLog.Status.SENT,
             to_email, subject, html_body, sent_by=sent_by_id)
        logger.info('Email sent to %s — %s', to_email, subject)
    except Exception as exc:
        _log(case, NotificationLog.NotificationType.EMAIL, NotificationLog.Status.FAILED,
             to_email, subject, html_body, error=str(exc), sent_by=sent_by_id)
        logger.error('Email FAILED to %s — %s: %s', to_email, subject, exc)
        raise


def _post_teams(case, message, sent_by_id=None):
    from apps.notifications.models import NotificationLog
    url = getattr(settings, 'TEAMS_WEBHOOK_URL', '')
    if not url:
        return
    payload = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        'summary': message,
        'sections': [{'text': message}],
    }
    try:
        resp = http_requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        _log(case, NotificationLog.NotificationType.TEAMS, NotificationLog.Status.SENT,
             '', 'Teams notification', message, sent_by=sent_by_id)
    except Exception as exc:
        _log(case, NotificationLog.NotificationType.TEAMS, NotificationLog.Status.FAILED,
             '', 'Teams notification', message, error=str(exc), sent_by=sent_by_id)
        logger.error('Teams webhook FAILED: %s', exc)


def _request_email_html(case, subject_line):
    arrival = case.arrival_time.strftime('%I:%M %p') if case.arrival_time else '—'
    start = case.start_time.strftime('%I:%M %p') if case.start_time else '—'
    end = case.end_time.strftime('%I:%M %p') if case.end_time else '—'
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#222;max-width:600px;margin:auto;padding:24px">
  <div style="background:#1e3a5f;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0">MVM CareSync — Vendor Coverage Request</h2>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p>Dear {case.vendor.contact_name if case.vendor else 'Vendor'},</p>
    <p>We are requesting vendor coverage for an upcoming ASC case. Please review the details below and confirm your availability at your earliest convenience.</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#f5f7fa">
        <td style="padding:8px 12px;font-weight:bold;width:40%">Facility</td>
        <td style="padding:8px 12px">{case.facility.name}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:bold">Address</td>
        <td style="padding:8px 12px">{case.facility.address}, {case.facility.city}, {case.facility.state}</td>
      </tr>
      <tr style="background:#f5f7fa">
        <td style="padding:8px 12px;font-weight:bold">Date</td>
        <td style="padding:8px 12px">{case.request_date.strftime('%A, %B %d, %Y')}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:bold">Service Needed</td>
        <td style="padding:8px 12px">{case.service_type.name}</td>
      </tr>
      <tr style="background:#f5f7fa">
        <td style="padding:8px 12px;font-weight:bold">Procedure / Case Type</td>
        <td style="padding:8px 12px">{case.procedure_type or '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:bold">Requested Arrival Time</td>
        <td style="padding:8px 12px">{arrival}</td>
      </tr>
      <tr style="background:#f5f7fa">
        <td style="padding:8px 12px;font-weight:bold">Estimated Case Start</td>
        <td style="padding:8px 12px">{start}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:bold">Estimated Case End</td>
        <td style="padding:8px 12px">{end}</td>
      </tr>
      <tr style="background:#f5f7fa">
        <td style="padding:8px 12px;font-weight:bold">Surgeon / Provider</td>
        <td style="padding:8px 12px">{case.surgeon_provider or '—'}</td>
      </tr>
      {"<tr><td style='padding:8px 12px;font-weight:bold'>Arrival Instructions</td><td style='padding:8px 12px'>" + case.facility.default_arrival_rules + "</td></tr>" if case.facility.default_arrival_rules else ""}
      {"<tr style='background:#f5f7fa'><td style='padding:8px 12px;font-weight:bold'>Parking / Access</td><td style='padding:8px 12px'>" + case.facility.parking_access_notes + "</td></tr>" if case.facility.parking_access_notes else ""}
      {"<tr><td style='padding:8px 12px;font-weight:bold'>Additional Notes</td><td style='padding:8px 12px'>" + case.notes + "</td></tr>" if case.notes else ""}
    </table>

    <div style="background:#fffbea;border:1px solid #f0c040;border-radius:6px;padding:12px 16px;margin:16px 0">
      <strong>Please reply to this email with:</strong>
      <ul style="margin:8px 0 0 0">
        <li>Availability confirmation or decline</li>
        <li>Assigned provider / technician name</li>
        <li>Any credentialing requirements</li>
        <li>Rate (if applicable)</li>
      </ul>
    </div>

    <p style="margin-top:24px">Thank you,<br><strong>MVM ASC Coordination Team</strong></p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="font-size:11px;color:#888">This is an automated message from MVM CareSync. Do not reply if this request does not apply to you.</p>
  </div>
</body>
</html>
"""


def _cancellation_email_html(case, reason):
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#222;max-width:600px;margin:auto;padding:24px">
  <div style="background:#b91c1c;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0">MVM CareSync — Coverage Request Cancelled</h2>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p>Dear {case.vendor.contact_name if case.vendor else 'Vendor'},</p>
    <p>Please be advised that the following coverage request has been <strong>cancelled</strong>. No action is required on your part.</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#fef2f2">
        <td style="padding:8px 12px;font-weight:bold;width:40%">Facility</td>
        <td style="padding:8px 12px">{case.facility.name}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:bold">Date</td>
        <td style="padding:8px 12px">{case.request_date.strftime('%A, %B %d, %Y')}</td>
      </tr>
      <tr style="background:#fef2f2">
        <td style="padding:8px 12px;font-weight:bold">Service</td>
        <td style="padding:8px 12px">{case.service_type.name}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:bold">Procedure / Case Type</td>
        <td style="padding:8px 12px">{case.procedure_type or '—'}</td>
      </tr>
      {"<tr style='background:#fef2f2'><td style='padding:8px 12px;font-weight:bold'>Cancellation Reason</td><td style='padding:8px 12px'>" + reason + "</td></tr>" if reason else ""}
    </table>

    <p style="margin-top:24px">Thank you for your partnership.<br><strong>MVM ASC Coordination Team</strong></p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="font-size:11px;color:#888">This is an automated message from MVM CareSync.</p>
  </div>
</body>
</html>
"""


def _reminder_email_html(case):
    arrival = case.arrival_time.strftime('%I:%M %p') if case.arrival_time else '—'
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#222;max-width:600px;margin:auto;padding:24px">
  <div style="background:#d97706;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0">MVM CareSync — Pending Request Reminder</h2>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p>This is a reminder that the following coverage request is still <strong>pending vendor confirmation</strong>.</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#fffbea">
        <td style="padding:8px 12px;font-weight:bold;width:40%">Facility</td>
        <td style="padding:8px 12px">{case.facility.name}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:bold">Date</td>
        <td style="padding:8px 12px">{case.request_date.strftime('%A, %B %d, %Y')}</td>
      </tr>
      <tr style="background:#fffbea">
        <td style="padding:8px 12px;font-weight:bold">Service</td>
        <td style="padding:8px 12px">{case.service_type.name}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:bold">Arrival Time</td>
        <td style="padding:8px 12px">{arrival}</td>
      </tr>
      <tr style="background:#fffbea">
        <td style="padding:8px 12px;font-weight:bold">Current Status</td>
        <td style="padding:8px 12px">{case.get_status_display()}</td>
      </tr>
    </table>

    <p>Please follow up with the vendor and update the request status in CareSync.</p>
    <p><strong>MVM ASC Coordination Team</strong></p>
  </div>
</body>
</html>
"""


# ── tasks ─────────────────────────────────────────────────────────────────

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_vendor_request_email(self, case_id, triggered_by_id=None):
    from apps.case_requests.models import CaseRequest
    try:
        case = CaseRequest.objects.select_related(
            'facility', 'service_type', 'vendor', 'requester'
        ).get(pk=case_id)
    except CaseRequest.DoesNotExist:
        logger.warning('send_vendor_request_email: case %s not found', case_id)
        return

    if not case.vendor:
        logger.info('send_vendor_request_email: case %s has no vendor assigned — skipping', case_id)
        return

    subject = (
        f"Coverage Request – {case.service_type.name} – "
        f"{case.facility.name} – {case.request_date.strftime('%m/%d/%Y')}"
    )
    html = _request_email_html(case, subject)

    try:
        _send_email(case.vendor.contact_email, subject, html, case, sent_by_id=triggered_by_id)
        # Also notify backup contact if present
        if case.vendor.backup_contact_email:
            _send_email(case.vendor.backup_contact_email, subject, html, case, sent_by_id=triggered_by_id)
    except Exception as exc:
        raise self.retry(exc=exc)

    _post_teams(
        case,
        f"📋 New coverage request submitted — {case.service_type.name} @ "
        f"{case.facility.name} on {case.request_date}",
        sent_by_id=triggered_by_id,
    )


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_vendor_cancellation_email(self, case_id, triggered_by_id=None, reason=''):
    from apps.case_requests.models import CaseRequest
    try:
        case = CaseRequest.objects.select_related(
            'facility', 'service_type', 'vendor'
        ).get(pk=case_id)
    except CaseRequest.DoesNotExist:
        return

    if not case.vendor:
        logger.info('send_vendor_cancellation_email: case %s has no vendor — skipping', case_id)
        return

    subject = (
        f"CANCELLED – Coverage Request – {case.service_type.name} – "
        f"{case.facility.name} – {case.request_date.strftime('%m/%d/%Y')}"
    )
    html = _cancellation_email_html(case, reason)

    try:
        _send_email(case.vendor.contact_email, subject, html, case, sent_by_id=triggered_by_id)
        if case.vendor.backup_contact_email:
            _send_email(case.vendor.backup_contact_email, subject, html, case, sent_by_id=triggered_by_id)
    except Exception as exc:
        raise self.retry(exc=exc)

    _post_teams(
        case,
        f"❌ Request cancelled — {case.service_type.name} @ "
        f"{case.facility.name} on {case.request_date}. Reason: {reason or 'Not specified'}",
        sent_by_id=triggered_by_id,
    )


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def notify_team_on_confirm(self, case_id, triggered_by_id=None):
    from apps.case_requests.models import CaseRequest
    from apps.users.models import User
    try:
        case = CaseRequest.objects.select_related(
            'facility', 'service_type', 'vendor', 'requester'
        ).get(pk=case_id)
    except CaseRequest.DoesNotExist:
        return

    vendor_name = case.vendor.name if case.vendor else 'Unknown vendor'
    subject = (
        f"CONFIRMED – {case.service_type.name} @ "
        f"{case.facility.name} – {case.request_date.strftime('%m/%d/%Y')}"
    )
    html = f"""
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#222;max-width:600px;margin:auto;padding:24px">
  <div style="background:#166534;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0">MVM CareSync — Request Confirmed</h2>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p>The following coverage request has been <strong>confirmed</strong>:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#f0fdf4"><td style="padding:8px 12px;font-weight:bold;width:40%">Facility</td><td style="padding:8px 12px">{case.facility.name}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold">Date</td><td style="padding:8px 12px">{case.request_date.strftime('%A, %B %d, %Y')}</td></tr>
      <tr style="background:#f0fdf4"><td style="padding:8px 12px;font-weight:bold">Service</td><td style="padding:8px 12px">{case.service_type.name}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold">Vendor</td><td style="padding:8px 12px">{vendor_name}</td></tr>
      {"<tr style='background:#f0fdf4'><td style='padding:8px 12px;font-weight:bold'>Notes</td><td style='padding:8px 12px'>" + case.confirmation_notes + "</td></tr>" if case.confirmation_notes else ""}
    </table>
    <p><strong>MVM ASC Coordination Team</strong></p>
  </div>
</body></html>
"""
    # Notify requester
    try:
        _send_email(case.requester.email, subject, html, case, sent_by_id=triggered_by_id)
    except Exception as exc:
        raise self.retry(exc=exc)

    _post_teams(
        case,
        f"✅ Confirmed — {case.service_type.name} @ {case.facility.name} on {case.request_date} | {vendor_name}",
        sent_by_id=triggered_by_id,
    )


@shared_task
def send_pending_reminders():
    """
    Sweep for open requests with request_date within the next 48 hours
    that are still in requested or backup_needed status.
    Send reminder email to the requester.
    """
    from apps.case_requests.models import CaseRequest
    from apps.notifications.models import NotificationLog

    now = timezone.localdate()
    cutoff = now + timezone.timedelta(days=2)

    open_statuses = [
        CaseRequest.Status.REQUESTED,
        CaseRequest.Status.BACKUP_NEEDED,
    ]

    cases = (
        CaseRequest.objects
        .select_related('facility', 'service_type', 'vendor', 'requester')
        .filter(status__in=open_statuses, request_date__lte=cutoff, request_date__gte=now)
    )

    for case in cases:
        # Skip if we already sent a reminder today
        already_reminded = NotificationLog.objects.filter(
            request=case,
            notification_type=NotificationLog.NotificationType.INTERNAL,
            status=NotificationLog.Status.SENT,
            created_at__date=now,
        ).exists()
        if already_reminded:
            continue

        subject = (
            f"⚠️ Reminder: Pending Coverage – {case.service_type.name} @ "
            f"{case.facility.name} – {case.request_date.strftime('%m/%d/%Y')}"
        )
        html = _reminder_email_html(case)
        try:
            _send_email(case.requester.email, subject, html, case)
            # override type to INTERNAL after logging
            log = NotificationLog.objects.filter(
                request=case,
                recipient_email=case.requester.email,
            ).order_by('-created_at').first()
            if log:
                log.notification_type = NotificationLog.NotificationType.INTERNAL
                log.save(update_fields=['notification_type'])
        except Exception:
            pass  # already logged in _send_email

        _post_teams(
            case,
            f"⚠️ REMINDER — {case.service_type.name} @ {case.facility.name} on "
            f"{case.request_date} is still {case.get_status_display()}",
        )

    logger.info('send_pending_reminders: checked %d open requests', cases.count())
