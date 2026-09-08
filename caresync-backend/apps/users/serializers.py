from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name',
                  'full_name', 'role', 'department', 'phone', 'is_active',
                  'date_joined', 'last_login')
        read_only_fields = ('id', 'date_joined', 'last_login', 'full_name')


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name',
                  'password', 'role', 'department', 'phone')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    """Admin-level update — allows role and is_active changes."""
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'department', 'phone', 'role', 'is_active')


class UserSelfUpdateSerializer(serializers.ModelSerializer):
    """Self-update — profile info only, no role/is_active escalation."""
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'department', 'phone')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError('Passwords do not match.')
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError('Passwords do not match.')
        return data
