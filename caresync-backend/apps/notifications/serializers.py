from rest_framework import serializers

from .models import NotificationLog


class NotificationLogSerializer(serializers.ModelSerializer):
    request_info = serializers.SerializerMethodField()
    sent_by_name = serializers.SerializerMethodField()

    class Meta:
        model = NotificationLog
        fields = [
            'id', 'request', 'request_info', 'notification_type', 'status',
            'recipient_email', 'subject', 'error_message', 'sent_by_name', 'created_at',
        ]

    def get_request_info(self, obj):
        req = obj.request
        return {
            'id': str(req.id),
            'facility': req.facility.name,
            'service_type': req.service_type.name,
            'request_date': str(req.request_date),
            'status': req.status,
        }

    def get_sent_by_name(self, obj):
        return obj.sent_by.get_full_name() or obj.sent_by.username if obj.sent_by else None
