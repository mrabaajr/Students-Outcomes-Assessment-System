from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserSerializer, UserDetailSerializer, UserCreateSerializer
from .utils import generate_temporary_password, send_account_creation_email

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UserDetailSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user"""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
    
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
        
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            username=email
        )
        
        serializer = UserSerializer(user)
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
        return Response({
            'user': serializer.data,
            'email_sent': email_sent,
            'message': 'Account created successfully. Temporary password sent to email.'
        }, status=status.HTTP_201_CREATED)
