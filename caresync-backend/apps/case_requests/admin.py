from django.contrib import admin

from .models import CaseRequest, RequestStatusHistory, VendorCoverageRule


class StatusHistoryInline(admin.TabularInline):
    model = RequestStatusHistory
    extra = 0
    readonly_fields = ('created_at', 'changed_by', 'previous_status', 'new_status', 'notes')
    can_delete = False


@admin.register(CaseRequest)
class CaseRequestAdmin(admin.ModelAdmin):
    list_display = ('request_date', 'facility', 'service_type', 'vendor', 'status', 'requester')
    list_filter = ('status', 'facility', 'service_type', 'request_date')
    search_fields = ('patient_identifier', 'surgeon_provider', 'vendor__name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [StatusHistoryInline]


@admin.register(RequestStatusHistory)
class RequestStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('request', 'previous_status', 'new_status', 'changed_by', 'created_at')
    readonly_fields = ('id', 'created_at')


@admin.register(VendorCoverageRule)
class VendorCoverageRuleAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'facility', 'service_type', 'is_preferred', 'is_active')
    list_filter = ('facility', 'service_type', 'is_active', 'is_preferred')
    search_fields = ('vendor__name',)
