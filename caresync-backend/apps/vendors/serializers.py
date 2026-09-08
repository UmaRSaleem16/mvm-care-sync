from rest_framework import serializers

from .models import ServiceType, Vendor


class ServiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceType
        fields = ('id', 'name', 'code', 'description', 'is_active')


class VendorSerializer(serializers.ModelSerializer):
    service_type_name = serializers.CharField(source='service_type.name', read_only=True)
    is_bookable = serializers.ReadOnlyField()

    class Meta:
        model = Vendor
        fields = (
            'id', 'name', 'service_type', 'service_type_name',
            'contact_name', 'contact_email', 'contact_phone',
            'backup_contact_name', 'backup_contact_email', 'backup_contact_phone',
            'contract_status', 'credentialing_status',
            'services_provided', 'notes', 'is_active', 'is_bookable',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'is_bookable')


class VendorListSerializer(serializers.ModelSerializer):
    service_type_name = serializers.CharField(source='service_type.name', read_only=True)
    is_bookable = serializers.ReadOnlyField()

    class Meta:
        model = Vendor
        fields = (
            'id', 'name', 'service_type', 'service_type_name',
            'contact_name', 'contact_email', 'contact_phone',
            'contract_status', 'credentialing_status',
            'is_active', 'is_bookable',
        )
