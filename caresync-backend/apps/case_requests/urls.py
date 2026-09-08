from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CaseRequestViewSet, dashboard_stats, vendor_match

router = DefaultRouter()
router.register('', CaseRequestViewSet, basename='case-requests')

urlpatterns = [
    path('dashboard-stats/', dashboard_stats, name='dashboard-stats'),
    path('match-vendors/', vendor_match, name='match-vendors'),
    path('', include(router.urls)),
]
