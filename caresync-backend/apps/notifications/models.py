from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class NotificationLog(TimeStampedModel):
    class NotificationType(models.TextChoices):
        EMAIL = 'email', 'Email'
        TEAMS = 'teams', 'Microsoft Teams'
        INTERNAL = 'internal', 'Internal'

    class Status(models.TextChoices):
        SENT = 'sent', 'Sent'
        SIMULATED = 'simulated', 'Simulated (preview saved)'
        FAILED = 'failed', 'Failed'
        PENDING = 'pending', 'Pending'

    request = models.ForeignKey(
        'case_requests.CaseRequest',
        on_delete=models.CASCADE,
        related_name='notification_logs',
    )
    notification_type = models.CharField(
        max_length=20, choices=NotificationType.choices, default=NotificationType.EMAIL
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    recipient_email = models.EmailField(blank=True)
    subject = models.CharField(max_length=300, blank=True)
    body = models.TextField(blank=True)
    error_message = models.TextField(blank=True)

    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='sent_notifications',
    )

    class Meta:
        db_table = 'notification_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} to {self.recipient_email} — {self.get_status_display()}"
