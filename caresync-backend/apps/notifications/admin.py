from django.contrib import admin

from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('request', 'notification_type', 'status', 'recipient_email', 'created_at')
    list_filter = ('notification_type', 'status')
    search_fields = ('recipient_email', 'subject')
    readonly_fields = ('id', 'created_at', 'updated_at')
