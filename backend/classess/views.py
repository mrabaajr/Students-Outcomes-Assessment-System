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
import csv
from io import TextIOWrapper
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

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

    @action(detail=False, methods=['post'], url_path='import-csv')
    def import_csv(self, request):
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can import students.")

        file = request.FILES.get('file')

        if not file:
            return Response(
                {"error": "No file uploaded."},
                status=status.HTTP_400_BAD_REQUEST
            )

        decoded_file = TextIOWrapper(file.file, encoding='utf-8')
        reader = csv.DictReader(decoded_file)

        created_count = 0
        skipped_count = 0

        for row in reader:
            student_id = row.get('student_id')

            if Student.objects.filter(student_id=student_id).exists():
                skipped_count += 1
                continue

            Student.objects.create(
                student_id=student_id,
                first_name=row.get('first_name'),
                last_name=row.get('last_name'),
                program=row.get('program'),
                year_level=row.get('year_level'),
            )

            created_count += 1

        return Response({
            "message": "Import completed",
            "created": created_count,
            "skipped": skipped_count
        })

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