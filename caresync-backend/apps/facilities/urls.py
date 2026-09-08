from rest_framework.routers import DefaultRouter

from .views import FacilityViewSet

router = DefaultRouter()
router.register(r'', FacilityViewSet, basename='facilities')

urlpatterns = router.urls
