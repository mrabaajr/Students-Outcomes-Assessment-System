from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin that extends Django's UserAdmin so passwords are
    properly hashed when creating/changing users via the admin panel.
    """
    list_display = ('email', 'username', 'first_name', 'last_name', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'username')

    # Add custom fields to the default UserAdmin fieldsets
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Extra Info', {'fields': ('role', 'department')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Extra Info', {'fields': ('email', 'first_name', 'last_name', 'role', 'department')}),
    )
