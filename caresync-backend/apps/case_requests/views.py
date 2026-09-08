from django.utils import timezone
from django_filters import rest_framework as df_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsCoordinatorOrAdmin, IsStaffOrAbove
from apps.notifications.tasks import (
    notify_team_on_confirm,
    send_vendor_cancellation_email,
    send_vendor_request_email,
)
from apps.vendors.models import Vendor
from apps.vendors.serializers import VendorListSerializer

from .matching import match_vendors
from .models import CaseRequest, RequestStatusHistory
from .serializers import (
    CaseRequestListSerializer,
    CaseRequestSerializer,
)


class CaseRequestFilter(df_filters.FilterSet):
    status = df_filters.CharFilter(field_name='status')
    facility = df_filters.UUIDFilter(field_name='facility')
    service_type = df_filters.UUIDFilter(field_name='service_type')
    vendor = df_filters.UUIDFilter(field_name='vendor')
    request_date = df_filters.DateFilter(field_name='request_date')
    request_date_after = df_filters.DateFilter(field_name='request_date', lookup_expr='gte')
    request_date_before = df_filters.DateFilter(field_name='request_date', lookup_expr='lte')

    class Meta:
        model = CaseRequest
        fields = ['status', 'facility', 'service_type', 'vendor', 'request_date',
                  'request_date_after', 'request_date_before']


class CaseRequestViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CaseRequestFilter
    search_fields = ['patient_identifier', 'surgeon_provider', 'procedure_type']
    ordering_fields = ['request_date', 'created_at', 'status']

    def get_queryset(self):
        return (
            CaseRequest.objects
            .select_related('facility', 'service_type', 'vendor', 'requester')
            .prefetch_related('history__changed_by')
            .order_by('-request_date', '-created_at')
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return CaseRequestListSerializer
        return CaseRequestSerializer

    def get_permissions(self):
        if self.action in ('destroy', 'confirm', 'cancel', 'complete', 'assign_vendor'):
            return [IsCoordinatorOrAdmin()]
        if self.action in ('create', 'update', 'partial_update', 'submit', 'backup_needed'):
            return [IsStaffOrAbove()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        case = self.get_object()
        if case.status != CaseRequest.Status.DRAFT:
            return Response(
                {'detail': 'Only draft requests can be submitted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        prev = case.status
        case.status = CaseRequest.Status.REQUESTED
        case.save(update_fields=['status', 'updated_at'])
        RequestStatusHistory.objects.create(
            request=case,
            previous_status=prev,
            new_status=case.status,
            changed_by=request.user,
            notes='Submitted for vendor notification.',
        )
        send_vendor_request_email.delay(str(case.id), str(request.user.id))
        return Response(
            CaseRequestSerializer(case, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        case = self.get_object()
        confirmable = {
            CaseRequest.Status.REQUESTED,
            CaseRequest.Status.VENDOR_RESPONDED,
            CaseRequest.Status.BACKUP_NEEDED,
            CaseRequest.Status.CREDENTIALING_PENDING,
        }
        if case.status not in confirmable:
            return Response(
                {'detail': 'This request cannot be confirmed from its current status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        notes = request.data.get('confirmation_notes', '').strip()
        prev = case.status
        case.status = CaseRequest.Status.CONFIRMED
        case.confirmation_notes = notes
        case.save(update_fields=['status', 'confirmation_notes', 'updated_at'])
        RequestStatusHistory.objects.create(
            request=case,
            previous_status=prev,
            new_status=case.status,
            changed_by=request.user,
            notes=notes or 'Confirmed.',
        )
        notify_team_on_confirm.delay(str(case.id), str(request.user.id))
        return Response(CaseRequestSerializer(case, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        case = self.get_object()
        if case.status in (CaseRequest.Status.CANCELLED, CaseRequest.Status.COMPLETED):
            return Response(
                {'detail': 'Request is already closed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reason = request.data.get('reason', '').strip()
        prev = case.status
        case.status = CaseRequest.Status.CANCELLED
        case.save(update_fields=['status', 'updated_at'])
        RequestStatusHistory.objects.create(
            request=case,
            previous_status=prev,
            new_status=case.status,
            changed_by=request.user,
            notes=reason or 'Cancelled.',
        )
        send_vendor_cancellation_email.delay(str(case.id), str(request.user.id), reason)
        return Response(CaseRequestSerializer(case, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def backup_needed(self, request, pk=None):
        case = self.get_object()
        eligible = {CaseRequest.Status.REQUESTED, CaseRequest.Status.VENDOR_RESPONDED}
        if case.status not in eligible:
            return Response(
                {'detail': 'Can only flag backup needed from requested or vendor-responded status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reason = request.data.get('reason', '').strip()
        prev = case.status
        case.status = CaseRequest.Status.BACKUP_NEEDED
        case.vendor = None
        case.save(update_fields=['status', 'vendor', 'updated_at'])
        RequestStatusHistory.objects.create(
            request=case,
            previous_status=prev,
            new_status=case.status,
            changed_by=request.user,
            notes=reason or 'Backup vendor needed.',
        )
        return Response(CaseRequestSerializer(case, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        case = self.get_object()
        if case.status != CaseRequest.Status.CONFIRMED:
            return Response(
                {'detail': 'Only confirmed requests can be marked complete.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        prev = case.status
        case.status = CaseRequest.Status.COMPLETED
        case.save(update_fields=['status', 'updated_at'])
        RequestStatusHistory.objects.create(
            request=case,
            previous_status=prev,
            new_status=case.status,
            changed_by=request.user,
            notes='Case completed.',
        )
        return Response(CaseRequestSerializer(case, context={'request': request}).data)

    @action(detail=True, methods=['patch'])
    def assign_vendor(self, request, pk=None):
        case = self.get_object()
        vendor_id = request.data.get('vendor')
        if vendor_id:
            try:
                vendor = Vendor.objects.get(pk=vendor_id, is_active=True)
            except Vendor.DoesNotExist:
                return Response(
                    {'detail': 'Vendor not found or not currently active.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            case.vendor = vendor
        else:
            case.vendor = None
        case.save(update_fields=['vendor', 'updated_at'])
        return Response(CaseRequestSerializer(case, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vendor_match(request):
    """
    GET /api/v1/requests/match-vendors/?facility=<id>&service_type=<id>

    Returns:
      {
        "matches": [...vendors...],
        "auto_selected": <vendor|null>,   # if exactly 1 bookable match
        "count": <int>,
        "has_preferred": <bool>,
      }
    """
    facility_id = request.query_params.get('facility')
    service_type_id = request.query_params.get('service_type')

    if not facility_id or not service_type_id:
        return Response(
            {'detail': 'facility and service_type query params are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    results = match_vendors(facility_id, service_type_id)

    vendors_data = VendorListSerializer(
        [r.vendor for r in results], many=True
    ).data

    # Annotate each vendor with is_preferred flag from the matching rule
    for i, r in enumerate(results):
        vendors_data[i]['is_preferred'] = r.is_preferred  # type: ignore[index]

    auto_selected = None
    if len(results) == 1:
        auto_selected = vendors_data[0]

    return Response({
        'matches': vendors_data,
        'auto_selected': auto_selected,
        'count': len(results),
        'has_preferred': any(r.is_preferred for r in results),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    today = timezone.localdate()
    qs = CaseRequest.objects.all()

    stats = {
        'open_requests': qs.filter(
            status__in=['requested', 'vendor_responded', 'backup_needed']
        ).count(),
        'confirmed_today': qs.filter(
            status='confirmed', updated_at__date=today
        ).count(),
        'pending_response': qs.filter(status='requested').count(),
        'backup_needed': qs.filter(status='backup_needed').count(),
        'total_requests': qs.count(),
        'draft': qs.filter(status='draft').count(),
        'cancelled': qs.filter(status='cancelled').count(),
        'completed': qs.filter(status='completed').count(),
    }

    recent = (
        qs.select_related('facility', 'service_type', 'vendor', 'requester')
        .order_by('-created_at')[:5]
    )
    stats['recent_requests'] = CaseRequestListSerializer(recent, many=True).data

    return Response(stats)
