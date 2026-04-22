from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager as DefaultUserManager

class UserManager(DefaultUserManager):
    def create_superuser(self, username, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')  # Automatically set role to admin
        return super().create_superuser(username, email, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Program Chair'),
        ('staff', 'Staff'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    department = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ("login", "Login"),
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("import", "Import"),
        ("save", "Save"),
        ("security", "Security"),
    )

    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    actor_name = models.CharField(max_length=255, blank=True)
    actor_role = models.CharField(max_length=20, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=100)
    target_name = models.CharField(max_length=255)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.actor_name or 'Unknown user'} {self.action} {self.target_type}"
