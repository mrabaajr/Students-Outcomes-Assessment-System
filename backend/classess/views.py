import re

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

import csv
from io import TextIOWrapper

from .models import Student, Section, Enrollment, Faculty, FacultyCourseAssignment
from .serializers import (
    StudentSerializer,
    SectionSerializer,
    SectionDetailSerializer,
    EnrollmentSerializer,
    ClassesFacultySerializer,
)
from users.models import User
from courses.models import Course, Curriculum

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

    # --------------------------------------------------
    # load_all – returns all sections + faculty in the
    # frontend's data format so the Classes page can
    # hydrate from the backend on mount.
    # --------------------------------------------------
    @action(detail=False, methods=['get'], permission_classes=[AllowAny],
            url_path='load_all')
    def load_all(self, request):
        sections = (
            Section.objects
            .select_related('course', 'assigned_faculty')
            .prefetch_related('enrollments__student')
            .all()
        )

        def _year_str(level):
            suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(level, 'th')
            return f"{level}{suffix} Year"

        sections_payload = []
        for sec in sections:
            students = []
            for enr in sec.enrollments.all():
                s = enr.student
                students.append({
                    'id': str(s.id),
                    'name': f"{s.first_name} {s.last_name}",
                    'studentId': s.student_id,
                    'course': s.program,
                    'yearLevel': _year_str(s.year_level),
                })
            sections_payload.append({
                'id': str(sec.id),
                'name': sec.name,
                'courseCode': sec.course.code,
                'courseName': sec.course.name,
                'schedule': sec.schedule or '',
                'room': sec.room or '',
                'schoolYear': sec.school_year or '',
                'students': students,
            })

        # Faculty from the dedicated Faculty model
        faculty_qs = (
            Faculty.objects
            .prefetch_related('course_assignments')
            .all()
        )
        faculty_payload = []
        for fac in faculty_qs:
            courses = []
            for ca in fac.course_assignments.all():
                courses.append({
                    'code': ca.course_code,
                    'name': ca.course_name,
                    'sections': ca.get_sections_list(),
                })
            faculty_payload.append({
                'id': str(fac.id),
                'name': fac.name,
                'department': fac.department or 'Computer Engineering',
                'email': fac.email,
                'courses': courses,
            })

        return Response({
            'sections': sections_payload,
            'faculty': faculty_payload,
        })

    # --------------------------------------------------
    # bulk_save – persists the entire Classes-page state
    # (sections + faculty + students) to the database in
    # a single atomic transaction.
    # --------------------------------------------------
    @action(detail=False, methods=['post'], permission_classes=[AllowAny],
            url_path='bulk_save')
    def bulk_save(self, request):
        sections_data = request.data.get('sections', [])
        faculty_data = request.data.get('faculty', [])

        if not sections_data and not faculty_data:
            return Response(
                {'detail': 'No data provided', 'success': False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                # ── 1. Faculty (dedicated Faculty model) ─────────────
                saved_faculty_ids = set()
                faculty_email_map = {}     # email → Faculty instance
                for fac in faculty_data:
                    fac_obj, _ = Faculty.objects.update_or_create(
                        email=fac['email'],
                        defaults={
                            'name': fac.get('name', ''),
                            'department': fac.get('department', 'Computer Engineering'),
                        },
                    )
                    saved_faculty_ids.add(fac_obj.id)
                    faculty_email_map[fac['email']] = fac_obj

                    # Save course assignments
                    saved_assignment_ids = set()
                    for ci in fac.get('courses', []):
                        ca, _ = FacultyCourseAssignment.objects.update_or_create(
                            faculty=fac_obj,
                            course_code=ci['code'],
                            defaults={
                                'course_name': ci.get('name', ci['code']),
                            },
                        )
                        ca.set_sections_list(ci.get('sections', []))
                        ca.save()
                        saved_assignment_ids.add(ca.id)

                    # Remove course assignments no longer present
                    FacultyCourseAssignment.objects.filter(
                        faculty=fac_obj,
                    ).exclude(id__in=saved_assignment_ids).delete()

                # Remove faculty no longer in frontend state
                Faculty.objects.exclude(id__in=saved_faculty_ids).delete()

                # ── 2. Map (section_name, course_code) → Faculty ────
                section_faculty = {}
                for fac in faculty_data:
                    fac_obj = faculty_email_map[fac['email']]
                    for ci in fac.get('courses', []):
                        for sec_name in ci.get('sections', []):
                            section_faculty[(sec_name, ci['code'])] = fac_obj

                # ── 3. Sections ──────────────────────────────────────
                default_curriculum, _ = Curriculum.objects.get_or_create(
                    year='2025',
                )

                saved_section_ids = set()
                for sec in sections_data:
                    course_code = sec.get('courseCode', '')
                    course, _ = Course.objects.get_or_create(
                        code=course_code,
                        defaults={
                            'name': sec.get('courseName', course_code),
                            'curriculum': default_curriculum,
                            'year_level': '1st Year',
                            'semester': '1st Semester',
                        },
                    )

                    fac_obj = section_faculty.get(
                        (sec['name'], course_code)
                    )

                    school_year = sec.get('schoolYear', '')
                    section_obj, _ = Section.objects.update_or_create(
                        name=sec['name'],
                        course=course,
                        school_year=school_year,
                        defaults={
                            'assigned_faculty': fac_obj,
                            'room': sec.get('room', ''),
                            'schedule': sec.get('schedule', ''),
                        },
                    )
                    saved_section_ids.add(section_obj.id)

                    # ── 4. Students & Enrollments per section ────────
                    saved_enrollment_ids = set()
                    for stu in sec.get('students', []):
                        year_level = 1
                        yl = stu.get('yearLevel', '1')
                        m = re.search(r'\d+', yl)
                        if m:
                            year_level = int(m.group())

                        name_parts = stu.get('name', '').rsplit(' ', 1)
                        first = name_parts[0] if name_parts else ''
                        last = name_parts[1] if len(name_parts) > 1 else ''

                        student_obj, _ = Student.objects.update_or_create(
                            student_id=stu['studentId'],
                            defaults={
                                'first_name': first,
                                'last_name': last,
                                'program': stu.get('course', ''),
                                'year_level': year_level,
                            },
                        )

                        enrollment_obj, _ = Enrollment.objects.update_or_create(
                            student=student_obj,
                            course=course,
                            defaults={'section': section_obj},
                        )
                        saved_enrollment_ids.add(enrollment_obj.id)

                    # Remove enrollments dropped from this section
                    Enrollment.objects.filter(
                        section=section_obj,
                    ).exclude(id__in=saved_enrollment_ids).delete()

                # ── 5. Remove sections no longer in frontend state ───
                stale_sections = Section.objects.exclude(id__in=saved_section_ids)
                Enrollment.objects.filter(section__in=stale_sections).delete()
                stale_sections.delete()

            return Response({
                'message': 'Classes saved successfully',
                'success': True,
            })

        except Exception as e:
            return Response(
                {'detail': f'Error saving classes: {str(e)}', 'success': False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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