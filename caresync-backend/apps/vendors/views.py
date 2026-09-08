from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from apps.common.permissions import IsCoordinatorOrAdmin

from .models import ServiceType, Vendor
from .serializers import ServiceTypeSerializer, VendorListSerializer, VendorSerializer


class ServiceTypeViewSet(ReadOnlyModelViewSet):
    queryset = ServiceType.objects.filter(is_active=True)
    serializer_class = ServiceTypeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class VendorViewSet(ModelViewSet):
    queryset = Vendor.objects.select_related('service_type').order_by('name')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['service_type', 'contract_status', 'credentialing_status', 'is_active']
    search_fields = ['name', 'contact_name', 'contact_email']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return VendorListSerializer
        return VendorSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'toggle_active'):
            return [IsCoordinatorOrAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        vendor = self.get_object()
        vendor.is_active = not vendor.is_active
        vendor.save(update_fields=['is_active'])
        state = 'activated' if vendor.is_active else 'deactivated'
        return Response(
            {'is_active': vendor.is_active, 'message': f'Vendor {state}.'},
            status=status.HTTP_200_OK,
        )
