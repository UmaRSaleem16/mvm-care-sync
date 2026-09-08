from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsAdminUser

from .models import User
from .serializers import (
    ChangePasswordSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserCreateSerializer,
    UserSelfUpdateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


class UserViewSet(ModelViewSet):
    queryset = User.objects.all().order_by('last_name', 'first_name')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('create', 'destroy', 'update', 'partial_update'):
            return [IsAdminUser()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        if request.method == 'GET':
            return Response(UserSerializer(request.user).data)
        serializer = UserSelfUpdateSerializer(request.user, data=request.data,
                                              partial=request.method == 'PATCH')
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.check_password(serializer.validated_data['old_password']):
            return Response({'detail': 'Old password is incorrect.'},
                            status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password updated successfully.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """Send a password reset link to the user's email address."""
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']
    try:
        user = User.objects.get(email=email, is_active=True)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_url = f"{frontend_url}/reset-password/{uid}/{token}"
        send_mail(
            subject='MVMCareSync — Password Reset Request',
            message=(
                f"Hello {user.first_name or user.username},\n\n"
                f"Click the link below to reset your password:\n{reset_url}\n\n"
                "This link expires in 24 hours. If you did not request this, ignore this email.\n\n"
                "— MVMCareSync Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except User.DoesNotExist:
        pass  # never reveal whether the email exists

    return Response({
        'detail': 'If an account with that email exists, a reset link has been sent.'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Validate reset token and set a new password."""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    uid = serializer.validated_data['uid']
    token = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']

    try:
        user_pk = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_pk, is_active=True)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return Response({'detail': 'Invalid reset link.'},
                        status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({'detail': 'This reset link has expired or already been used.'},
                        status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'detail': 'Password reset successfully. You can now sign in.'})
