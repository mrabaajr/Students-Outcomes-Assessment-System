from rest_framework import serializers
from .models import AuditLog, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'department', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'department', 'username', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating user accounts with temporary passwords"""
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'role', 'department')
        required_fields = ('email', 'first_name', 'last_name', 'role')
    
    def validate_role(self, value):
        if value not in ['admin', 'staff']:
            raise serializers.ValidationError("Invalid role. Must be 'admin' or 'staff'.")
        return value


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = (
            "id",
            "actor_name",
            "actor_role",
            "action",
            "target_type",
            "target_name",
            "description",
            "metadata",
            "created_at",
        )
