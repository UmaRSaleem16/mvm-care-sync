from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrator'
        STAFF = 'staff', 'ASC Staff'
        COORDINATOR = 'coordinator', 'ASC Coordinator'
        READONLY = 'readonly', 'Read Only'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STAFF)
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_coordinator(self):
        return self.role in (self.Role.ADMIN, self.Role.COORDINATOR)

    @property
    def is_readonly(self):
        return self.role == self.Role.READONLY

    @property
    def full_name(self):
        return self.get_full_name() or self.username
