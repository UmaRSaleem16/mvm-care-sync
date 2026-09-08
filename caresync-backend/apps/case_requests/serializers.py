from rest_framework import serializers

from apps.facilities.models import Facility
from apps.facilities.serializers import FacilityListSerializer
from apps.vendors.models import ServiceType, Vendor
from apps.vendors.serializers import ServiceTypeSerializer, VendorListSerializer

from .models import CaseRequest, RequestStatusHistory, VendorCoverageRule


class CaseRequestListSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source='facility.name', read_only=True)
    service_type_name = serializers.CharField(source='service_type.name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True, default=None)
    requester_name = serializers.CharField(source='requester.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CaseRequest
        fields = (
            'id', 'request_date', 'facility_name', 'service_type_name',
            'vendor_name', 'status', 'status_display', 'requester_name',
            'patient_identifier', 'surgeon_provider', 'created_at', 'updated_at',
        )


class RequestStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)

    class Meta:
        model = RequestStatusHistory
        fields = (
            'id', 'previous_status', 'new_status', 'changed_by_name', 'notes', 'created_at',
        )


class CaseRequestSerializer(serializers.ModelSerializer):
    """Detail serializer — nested objects on read, IDs on write."""

    facility_detail = FacilityListSerializer(source='facility', read_only=True)
    service_type_detail = ServiceTypeSerializer(source='service_type', read_only=True)
    vendor_detail = VendorListSerializer(source='vendor', read_only=True)
    requester_name = serializers.CharField(source='requester.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    history = RequestStatusHistorySerializer(many=True, read_only=True)
    calendar_title = serializers.CharField(read_only=True)

    # Write fields
    facility = serializers.PrimaryKeyRelatedField(
        queryset=Facility.objects.filter(is_active=True)
    )
    service_type = serializers.PrimaryKeyRelatedField(
        queryset=ServiceType.objects.filter(is_active=True)
    )
    vendor = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = CaseRequest
        fields = (
            'id',
            'request_date',
            'facility', 'facility_detail',
            'service_type', 'service_type_detail',
            'vendor', 'vendor_detail',
            'procedure_type',
            'arrival_time', 'start_time', 'end_time',
            'patient_identifier',
            'surgeon_provider',
            'notes',
            'requester', 'requester_name',
            'status', 'status_display',
            'confirmation_notes',
            'calendar_title',
            'history',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'requester', 'status', 'confirmation_notes',
            'created_at', 'updated_at',
        )

    def validate_patient_identifier(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError(
                'Patient identifier must be at least 2 characters (use initials or case ID).'
            )
        if len(value) > 50:
            raise serializers.ValidationError(
                'Patient identifier too long — use initials or a short case ID only.'
            )
        return value

    def create(self, validated_data):
        validated_data['requester'] = self.context['request'].user
        validated_data.setdefault('status', CaseRequest.Status.DRAFT)
        instance = super().create(validated_data)
        RequestStatusHistory.objects.create(
            request=instance,
            previous_status='',
            new_status=instance.status,
            changed_by=instance.requester,
            notes='Request created.',
        )
        return instance


class VendorCoverageRuleSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    facility_name = serializers.CharField(source='facility.name', read_only=True)
    service_type_name = serializers.CharField(source='service_type.name', read_only=True)

    class Meta:
        model = VendorCoverageRule
        fields = (
            'id', 'vendor', 'vendor_name', 'facility', 'facility_name',
            'service_type', 'service_type_name', 'is_preferred', 'notes', 'is_active',
        )
