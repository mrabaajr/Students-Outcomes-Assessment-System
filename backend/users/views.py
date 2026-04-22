from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .audit import log_audit_event
from .models import AuditLog, EmailSettings, User
from .serializers import (
    AuditLogSerializer,
    EmailSettingsSerializer,
    UserCreateSerializer,
    UserDetailSerializer,
    UserSerializer,
)
from .utils import (
    generate_temporary_password,
    get_active_email_settings,
    send_account_creation_email,
    send_system_email,
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UserDetailSerializer
        return UserSerializer

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can delete user accounts.")
        if instance.role == 'admin':
            raise PermissionDenied("Admin accounts cannot be deleted here.")
        target_name = instance.email
        instance.delete()
        log_audit_event(
            self.request,
            action="delete",
            target_type="account",
            target_name=target_name,
            description=f"Deleted faculty account {target_name}.",
        )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user"""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change the current user's password after verifying the old password."""
        current_password = request.data.get('current_password') or request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not current_password or not new_password or not confirm_password:
            return Response(
                {'detail': 'Current password, new password, and confirmation are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {'detail': 'New passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.check_password(current_password):
            return Response(
                {'detail': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, request.user)
        except ValidationError as error:
            return Response(
                {'detail': ' '.join(error.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        log_audit_event(
            request,
            action="security",
            target_type="account",
            target_name=request.user.email,
            description="Changed account password.",
        )
        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_email(self, request):
        """Change the current user's account email after verifying the password."""
        new_email = (request.data.get('new_email') or "").strip().lower()
        current_password = request.data.get('current_password') or request.data.get('password')

        if not new_email or not current_password:
            return Response(
                {'detail': 'New email and current password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_email == (request.user.email or "").strip().lower():
            return Response(
                {'detail': 'The new email must be different from your current email.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email__iexact=new_email).exclude(id=request.user.id).exists():
            return Response(
                {'detail': 'Email already registered.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.check_password(current_password):
            return Response(
                {'detail': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_email = request.user.email
        request.user.email = new_email
        request.user.username = new_email
        request.user.save(update_fields=['email', 'username'])
        log_audit_event(
            request,
            action="security",
            target_type="account",
            target_name=new_email,
            description=f"Changed account email from {old_email} to {new_email}.",
            metadata={"old_email": old_email, "new_email": new_email},
        )
        return Response(
            {
                'message': 'Account email updated successfully.',
                'email': request.user.email,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def email_settings(self, request):
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can manage email settings.")

        email_settings = EmailSettings.objects.order_by("-updated_at").first()

        if request.method == 'GET':
            if not email_settings:
                defaults = get_active_email_settings()
                return Response(
                    {
                        "email_host": defaults["host"],
                        "email_port": defaults["port"],
                        "email_use_tls": defaults["use_tls"],
                        "email_host_user": defaults["username"],
                        "email_host_password": defaults["password"],
                        "default_from_email": defaults["from_email"],
                        "updated_at": None,
                    }
                )
            return Response(EmailSettingsSerializer(email_settings).data)

        serializer = EmailSettingsSerializer(instance=email_settings, data=request.data)
        serializer.is_valid(raise_exception=True)
        saved = serializer.save(updated_by=request.user)
        log_audit_event(
            request,
            action="update",
            target_type="email_settings",
            target_name=saved.default_from_email or saved.email_host or "SMTP configuration",
            description="Updated system email settings.",
        )
        return Response(
            {
                "message": "Email settings updated successfully.",
                "settings": EmailSettingsSerializer(saved).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def test_email_settings(self, request):
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can test email settings.")

        recipient_email = request.data.get('recipient_email') or request.user.email
        active_settings = get_active_email_settings()

        if not active_settings["host"] or not active_settings["from_email"]:
            return Response(
                {"detail": "Email settings are incomplete. Please provide at least host and from email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            send_system_email(
                "Assessment System Email Settings Test",
                (
                    "This is a test email from the Students Outcomes Assessment System.\n\n"
                    "If you received this message, the configured email settings are working."
                ),
                [recipient_email],
            )
        except Exception as exc:
            return Response(
                {"detail": f"Test email failed: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        log_audit_event(
            request,
            action="security",
            target_type="email_settings",
            target_name=recipient_email,
            description="Sent a test email using the configured email settings.",
        )
        return Response({"message": f"Test email sent to {recipient_email}."}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Login user and return JWT tokens"""
        email = request.data.get('email')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({'detail': 'User account is disabled'}, status=status.HTTP_401_UNAUTHORIZED)
        
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        log_audit_event(
            user=user,
            action="login",
            target_type="account",
            target_name=user.email,
            description="Logged into the system.",
        )
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Register a new user"""
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'staff')
        department = request.data.get('department', '')
        
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

        if role not in ['admin', 'staff']:
            return Response({'detail': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            username=email,
            role=role,
            department=department,
        )
        
        serializer = UserSerializer(user)
        log_audit_event(
            user=user,
            action="create",
            target_type="account",
            target_name=user.email,
            description="Registered a new account.",
            metadata={"role": role},
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def create_account(self, request):
        """
        Create account with temporary password (Admin/Developer only).
        Generates a temporary password and sends it via email.
        """
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'staff')  # 'admin' or 'staff'
        department = request.data.get('department', '')
        
        # Validate email
        if not email:
            return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate role
        if role not in ['admin', 'staff']:
            return Response({'detail': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate temporary password
        temporary_password = generate_temporary_password()
        
        # Create user with temporary password
        user = User.objects.create_user(
            email=email,
            password=temporary_password,
            first_name=first_name,
            last_name=last_name,
            username=email,
            role=role,
            department=department
        )
        
        # Send email with temporary password
        email_sent = send_account_creation_email(user, temporary_password)
        
        serializer = UserSerializer(user)
        log_audit_event(
            request,
            action="create",
            target_type="account",
            target_name=user.email,
            description=f"Created a {role} account with a temporary password.",
            metadata={"email_sent": email_sent, "role": role},
        )
        return Response({
            'user': serializer.data,
            'email_sent': email_sent,
            'message': 'Account created successfully. Temporary password sent to email.'
        }, status=status.HTTP_201_CREATED)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("actor").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can view the audit log.")

        queryset = super().get_queryset()

        limit = self.request.query_params.get("limit")
        if limit:
            try:
                queryset = queryset[: max(1, min(int(limit), 200))]
            except (TypeError, ValueError):
                pass

        return queryset
