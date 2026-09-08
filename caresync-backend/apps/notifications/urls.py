from rest_framework.routers import DefaultRouter

from .views import NotificationLogViewSet

router = DefaultRouter()
router.register('', NotificationLogViewSet, basename='notifications')

urlpatterns = router.urls
