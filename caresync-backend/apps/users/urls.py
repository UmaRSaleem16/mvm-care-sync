from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import UserViewSet, password_reset_confirm, password_reset_request

router = DefaultRouter()
router.register(r'', UserViewSet, basename='users')

urlpatterns = router.urls
