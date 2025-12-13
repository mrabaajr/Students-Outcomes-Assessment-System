from rest_framework import serializers
from .models import User

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
