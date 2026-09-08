from django.db import models

from apps.common.models import TimeStampedModel


class ServiceType(TimeStampedModel):
    """Lookup table: Anesthesia, CRNA, Neuro Monitoring, Device Rep, etc."""

    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=30, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'service_types'
        ordering = ['name']

    def __str__(self):
        return self.name


class Vendor(TimeStampedModel):
    class ContractStatus(models.TextChoices):
        ACTIVE = 'active', 'Active'
        PENDING = 'pending', 'Pending'
        EXPIRED = 'expired', 'Expired'
        NONE = 'none', 'None'

    class CredentialingStatus(models.TextChoices):
        APPROVED = 'approved', 'Approved'
        PENDING = 'pending', 'Pending'
        EXPIRED = 'expired', 'Expired'
        NOT_REQUIRED = 'not_required', 'Not Required'

    name = models.CharField(max_length=200)
    service_type = models.ForeignKey(
        ServiceType, on_delete=models.PROTECT, related_name='vendors'
    )

    # Primary contact
    contact_name = models.CharField(max_length=150)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True)

    # Backup contact
    backup_contact_name = models.CharField(max_length=150, blank=True)
    backup_contact_email = models.EmailField(blank=True)
    backup_contact_phone = models.CharField(max_length=20, blank=True)

    # Status
    contract_status = models.CharField(
        max_length=20, choices=ContractStatus.choices, default=ContractStatus.NONE
    )
    credentialing_status = models.CharField(
        max_length=20, choices=CredentialingStatus.choices, default=CredentialingStatus.PENDING
    )

    services_provided = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'vendors'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.service_type.name})"

    @property
    def is_bookable(self):
        """Only active vendors with an active contract are auto-matched."""
        return (
            self.is_active
            and self.contract_status == self.ContractStatus.ACTIVE
            and self.credentialing_status in (
                self.CredentialingStatus.APPROVED,
                self.CredentialingStatus.NOT_REQUIRED,
            )
        )
