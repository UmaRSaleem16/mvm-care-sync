from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from apps.users.views import password_reset_confirm, password_reset_request

API_V1 = 'api/v1/'

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Auth ────────────────────────────────────────────────────────────────
    path(f'{API_V1}auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path(f'{API_V1}auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path(f'{API_V1}auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path(f'{API_V1}auth/password-reset/', password_reset_request, name='password_reset_request'),
    path(f'{API_V1}auth/password-reset/confirm/', password_reset_confirm, name='password_reset_confirm'),

    # ── App modules ─────────────────────────────────────────────────────────
    path(f'{API_V1}users/', include('apps.users.urls')),
    path(f'{API_V1}vendors/', include('apps.vendors.urls')),
    path(f'{API_V1}facilities/', include('apps.facilities.urls')),
    path(f'{API_V1}requests/', include('apps.case_requests.urls')),
    path(f'{API_V1}notifications/', include('apps.notifications.urls')),
]
