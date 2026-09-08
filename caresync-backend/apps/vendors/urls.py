from rest_framework.routers import DefaultRouter

from .views import ServiceTypeViewSet, VendorViewSet

router = DefaultRouter()
router.register(r'service-types', ServiceTypeViewSet, basename='service-types')
router.register(r'', VendorViewSet, basename='vendors')

urlpatterns = router.urls
