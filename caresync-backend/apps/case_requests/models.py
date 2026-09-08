from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.facilities.models import Facility
from apps.vendors.models import ServiceType, Vendor


class CaseRequest(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        REQUESTED = 'requested', 'Requested'
        VENDOR_RESPONDED = 'vendor_responded', 'Vendor Responded'
        CONFIRMED = 'confirmed', 'Confirmed'
        BACKUP_NEEDED = 'backup_needed', 'Backup Needed'
        CREDENTIALING_PENDING = 'credentialing_pending', 'Credentialing Pending'
        CANCELLED = 'cancelled', 'Cancelled'
        COMPLETED = 'completed', 'Completed'

    # Core fields
    request_date = models.DateField()
    facility = models.ForeignKey(Facility, on_delete=models.PROTECT, related_name='requests')
    service_type = models.ForeignKey(ServiceType, on_delete=models.PROTECT, related_name='requests')
    vendor = models.ForeignKey(
        Vendor, null=True, blank=True, on_delete=models.SET_NULL, related_name='requests'
    )

    # Case details
    procedure_type = models.CharField(max_length=200, blank=True)
    arrival_time = models.TimeField(null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    # PHI-safe identifier — initials or case ID only
    patient_identifier = models.CharField(
        max_length=50,
        help_text='Patient initials or case ID only — no full name or DOB.',
    )
    surgeon_provider = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)

    # Internal tracking
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='case_requests'
    )
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)
    confirmation_notes = models.TextField(blank=True)

    class Meta:
        db_table = 'case_requests'
        ordering = ['-request_date', '-created_at']

    def __str__(self):
        return (
            f"{self.request_date} | {self.facility.name} | "
            f"{self.service_type.name} | {self.get_status_display()}"
        )

    @property
    def calendar_title(self):
        status_prefix = self.get_status_display().upper()
        vendor_part = f" | {self.vendor.name}" if self.vendor else ""
        return f"{status_prefix} – {self.service_type.name} – {self.facility.name}{vendor_part}"


class RequestStatusHistory(TimeStampedModel):
    """Immutable audit trail of every status transition."""

    request = models.ForeignKey(CaseRequest, on_delete=models.CASCADE, related_name='history')
    previous_status = models.CharField(max_length=30, blank=True)
    new_status = models.CharField(max_length=30, choices=CaseRequest.Status.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='status_changes'
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'request_status_history'
        ordering = ['created_at']
        verbose_name_plural = 'Request status histories'

    def __str__(self):
        return f"{self.request} → {self.new_status} by {self.changed_by}"


class VendorCoverageRule(TimeStampedModel):
    """Maps a vendor to an ASC+service combination for auto-matching."""

    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='coverage_rules')
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='coverage_rules')
    service_type = models.ForeignKey(
        ServiceType, on_delete=models.CASCADE, related_name='coverage_rules'
    )
    is_preferred = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'vendor_coverage_rules'
        unique_together = ('vendor', 'facility', 'service_type')
        ordering = ['-is_preferred', 'vendor__name']

    def __str__(self):
        preferred = ' (preferred)' if self.is_preferred else ''
        return f"{self.vendor.name} @ {self.facility.name} / {self.service_type.name}{preferred}"
