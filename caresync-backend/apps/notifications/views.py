from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.common.permissions import IsCoordinatorOrAdmin

from .models import NotificationLog
from .serializers import NotificationLogSerializer


class NotificationLogViewSet(ReadOnlyModelViewSet):
    permission_classes = [IsCoordinatorOrAdmin]
    serializer_class = NotificationLogSerializer

    def get_queryset(self):
        return (
            NotificationLog.objects
            .select_related('request__facility', 'request__service_type', 'sent_by')
            .order_by('-created_at')[:50]
        )
