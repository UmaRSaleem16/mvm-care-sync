from django.db import models

from apps.common.models import TimeStampedModel


class Facility(TimeStampedModel):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=50, default='PA')
    zip_code = models.CharField(max_length=10)

    contact_person = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    internal_coordinator = models.CharField(max_length=150, blank=True)

    default_arrival_rules = models.TextField(
        blank=True,
        help_text='Default instructions for vendor arrival time relative to case start.',
    )
    parking_access_notes = models.TextField(blank=True)
    vendor_specific_instructions = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'facilities'
        verbose_name = 'ASC Facility'
        verbose_name_plural = 'ASC Facilities'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def full_address(self):
        return f"{self.address}, {self.city}, {self.state} {self.zip_code}"
