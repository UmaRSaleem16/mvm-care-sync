from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsCoordinatorOrAdmin

from .models import Facility
from .serializers import FacilityListSerializer, FacilitySerializer


class FacilityViewSet(ModelViewSet):
    queryset = Facility.objects.order_by('name')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['state', 'is_active']
    search_fields = ['name', 'city', 'contact_person']
    ordering_fields = ['name', 'city', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return FacilityListSerializer
        return FacilitySerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'toggle_active'):
            return [IsCoordinatorOrAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        facility = self.get_object()
        facility.is_active = not facility.is_active
        facility.save(update_fields=['is_active'])
        state = 'activated' if facility.is_active else 'deactivated'
        return Response(
            {'is_active': facility.is_active, 'message': f'Facility {state}.'},
            status=status.HTTP_200_OK,
        )
