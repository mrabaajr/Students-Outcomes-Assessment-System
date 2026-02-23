from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Student, Section, Enrollment
from .serializers import (
    StudentSerializer,
    SectionSerializer,
    SectionDetailSerializer,
    EnrollmentSerializer
)


# ------------------------
# STUDENT VIEWSET
# ------------------------
class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can create students.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can update students.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can delete students.")
        instance.delete()


# ------------------------
# SECTION VIEWSET
# ------------------------
class SectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        base_queryset = Section.objects.select_related(
            'course',
            'faculty'
        ).prefetch_related('enrollments')

        # Admin sees all
        if user.role == 'admin':
            return base_queryset

        # Staff sees only their sections
        return base_queryset.filter(faculty=user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SectionDetailSerializer
        return SectionSerializer

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can create sections.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can update sections.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can delete sections.")
        instance.delete()

    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        # Staff cannot access sections not assigned to them
        if user.role == 'staff' and obj.faculty != user:
            raise PermissionDenied("You do not have access to this section.")

        return obj


# ------------------------
# ENROLLMENT VIEWSET
# ------------------------
class EnrollmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Enrollment.objects.select_related(
        'student',
        'section',
        'course'
    )
    serializer_class = EnrollmentSerializer

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can manage enrollments.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can manage enrollments.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can manage enrollments.")
        instance.delete()