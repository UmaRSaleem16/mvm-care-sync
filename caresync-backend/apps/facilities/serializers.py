from rest_framework import serializers

from .models import Facility


class FacilitySerializer(serializers.ModelSerializer):
    full_address = serializers.ReadOnlyField()

    class Meta:
        model = Facility
        fields = (
            'id', 'name', 'address', 'city', 'state', 'zip_code', 'full_address',
            'contact_person', 'phone', 'internal_coordinator',
            'default_arrival_rules', 'parking_access_notes',
            'vendor_specific_instructions', 'notes', 'is_active',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'full_address', 'created_at', 'updated_at')


class FacilityListSerializer(serializers.ModelSerializer):
    full_address = serializers.ReadOnlyField()

    class Meta:
        model = Facility
        fields = (
            'id', 'name', 'city', 'state', 'zip_code', 'full_address',
            'contact_person', 'phone', 'internal_coordinator', 'is_active',
        )
