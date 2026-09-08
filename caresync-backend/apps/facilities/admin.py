from django.contrib import admin

from .models import Facility


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'contact_person', 'is_active')
    list_filter = ('state', 'is_active')
    search_fields = ('name', 'city', 'contact_person')
    readonly_fields = ('id', 'created_at', 'updated_at')
