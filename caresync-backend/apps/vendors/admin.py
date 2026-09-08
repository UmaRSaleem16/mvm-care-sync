from django.contrib import admin

from .models import ServiceType, Vendor


@admin.register(ServiceType)
class ServiceTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active')
    search_fields = ('name', 'code')
    list_filter = ('is_active',)


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('name', 'service_type', 'contract_status', 'credentialing_status', 'is_active')
    list_filter = ('service_type', 'contract_status', 'credentialing_status', 'is_active')
    search_fields = ('name', 'contact_name', 'contact_email')
    readonly_fields = ('id', 'created_at', 'updated_at')
