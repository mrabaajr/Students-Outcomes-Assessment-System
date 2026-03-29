import csv
import re
from io import TextIOWrapper

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from courses.models import Course, Curriculum, SchoolYear
from users.models import User

from .models import Enrollment, Section, Student
from .serializers import (
    ClassesFacultySerializer,
    EnrollmentSerializer,
    SectionDetailSerializer,
    SectionSerializer,
    StudentSerializer,
)


DEFAULT_FACULTY_PASSWORD = "Faculty123!"
DEFAULT_DEPARTMENT = "Computer Engineering"


def build_faculty_name(user):
    if not user:
        return ""
    return " ".join(part for part in [user.first_name, user.last_name] if part).strip() or user.email


def split_full_name(full_name):
    cleaned_name = (full_name or "").strip()
    if not cleaned_name:
        return "", ""

    parts = cleaned_name.split()
    if len(parts) == 1:
        return parts[0], ""
    return " ".join(parts[:-1]), parts[-1]


class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def perform_create(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can create students.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can update students.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can delete students.")
        instance.delete()

    @action(detail=False, methods=["post"], url_path="import-csv")
    def import_csv(self, request):
        if request.user.role != "admin":
            raise PermissionDenied("Only admins can import students.")

        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        decoded_file = TextIOWrapper(file.file, encoding="utf-8")
        reader = csv.DictReader(decoded_file)

        created_count = 0
        skipped_count = 0

        for row in reader:
            student_id = row.get("student_id")
            if Student.objects.filter(student_id=student_id).exists():
                skipped_count += 1
                continue

            Student.objects.create(
                student_id=student_id,
                first_name=row.get("first_name"),
                last_name=row.get("last_name"),
                program=row.get("program"),
                year_level=row.get("year_level"),
            )
            created_count += 1

        return Response(
            {
                "message": "Import completed",
                "created": created_count,
                "skipped": skipped_count,
            }
        )


class SectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_authenticators(self):
        if getattr(self, "action", None) in ("load_all", "bulk_save", "import_csv_into_section"):
            return []
        return super().get_authenticators()

    def get_queryset(self):
        user = self.request.user
        base_queryset = Section.objects.select_related("course", "faculty").prefetch_related("enrollments")

        if not getattr(user, "is_authenticated", False):
            return base_queryset
        if user.role == "admin":
            return base_queryset
        return base_queryset.filter(faculty=user)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return SectionDetailSerializer
        return SectionSerializer

    def perform_create(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can create sections.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can update sections.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can delete sections.")
        instance.delete()

    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        if not getattr(user, "is_authenticated", False):
            return obj
        if user.role == "staff" and obj.faculty != user:
            raise PermissionDenied("You do not have access to this section.")

        return obj

    @action(detail=True, methods=["post"], permission_classes=[AllowAny], url_path="import-csv")
    def import_csv_into_section(self, request, pk=None):
        section = self.get_object()
        user = request.user
        user_role = getattr(user, "role", None)

        if user_role == "staff" and section.faculty != user:
            raise PermissionDenied("You do not have access to import students into this section.")
        if user_role and user_role not in ["admin", "staff"]:
            raise PermissionDenied("Only admins or assigned faculty can import students.")

        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_file = TextIOWrapper(file.file, encoding="utf-8")
            reader = csv.DictReader(decoded_file)

            if not reader.fieldnames:
                return Response({"error": "CSV file is empty."}, status=status.HTTP_400_BAD_REQUEST)

            required_columns = {"student_id", "first_name", "last_name", "program", "year_level"}
            csv_columns = set(reader.fieldnames) if reader.fieldnames else set()
            missing_columns = required_columns - csv_columns

            if missing_columns:
                return Response(
                    {"error": f"CSV is missing required columns: {', '.join(missing_columns)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            created_count = 0
            updated_count = 0
            skipped_count = 0
            errors = []

            with transaction.atomic():
                for row_num, row in enumerate(reader, start=2):
                    try:
                        student_id = row.get("student_id", "").strip()
                        first_name = row.get("first_name", "").strip()
                        last_name = row.get("last_name", "").strip()
                        program = row.get("program", "").strip()
                        year_level_str = row.get("year_level", "").strip()

                        if not student_id or not first_name or not last_name:
                            errors.append(f"Row {row_num}: Missing student_id, first_name, or last_name")
                            skipped_count += 1
                            continue

                        try:
                            year_level = int(year_level_str)
                            if year_level < 1 or year_level > 4:
                                errors.append(f"Row {row_num}: year_level must be between 1 and 4")
                                skipped_count += 1
                                continue
                        except (TypeError, ValueError):
                            errors.append(f"Row {row_num}: year_level must be a number")
                            skipped_count += 1
                            continue

                        student, created = Student.objects.update_or_create(
                            student_id=student_id,
                            defaults={
                                "first_name": first_name,
                                "last_name": last_name,
                                "program": program,
                                "year_level": year_level,
                            },
                        )

                        Enrollment.objects.update_or_create(
                            student=student,
                            course=section.course,
                            defaults={"section": section},
                        )

                        if created:
                            created_count += 1
                        else:
                            updated_count += 1

                    except Exception as exc:
                        errors.append(f"Row {row_num}: {str(exc)}")
                        skipped_count += 1

            return Response(
                {
                    "message": "CSV import completed",
                    "section": section.name,
                    "created": created_count,
                    "updated": updated_count,
                    "skipped": skipped_count,
                    "errors": errors if errors else [],
                },
                status=status.HTTP_200_OK,
            )

        except UnicodeDecodeError:
            return Response(
                {"error": "File encoding error. Please ensure the CSV file is UTF-8 encoded."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return Response(
                {"error": f"Error processing CSV: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], permission_classes=[AllowAny], url_path="load_all")
    def load_all(self, request):
        from courses.models import CourseSOMapping
        from courses.serializers import CourseSOMappingSerializer

        sections = (
            Section.objects.select_related("course", "course__curriculum", "faculty")
            .prefetch_related("enrollments__student")
            .all()
        )

        def _year_str(level):
            suffix = {1: "st", 2: "nd", 3: "rd"}.get(level, "th")
            return f"{level}{suffix} Year"

        sections_payload = []
        for sec in sections:
            students = []
            for enr in sec.enrollments.all():
                student = enr.student
                students.append(
                    {
                        "id": str(student.id),
                        "name": f"{student.first_name} {student.last_name}",
                        "studentId": student.student_id,
                        "course": student.program,
                        "yearLevel": _year_str(student.year_level),
                    }
                )

            student_outcomes = []
            try:
                mapping = CourseSOMapping.objects.filter(
                    course=sec.course,
                    academic_year=sec.academic_year,
                    semester=sec.semester or sec.course.semester,
                ).first()
                if not mapping:
                    mapping = (
                        CourseSOMapping.objects.filter(course=sec.course)
                        .order_by("-academic_year", "-updated_at")
                        .first()
                    )
                if mapping:
                    mapping_serializer = CourseSOMappingSerializer(mapping)
                    so_details = mapping_serializer.data.get("mapped_sos_details", [])
                    student_outcomes = [
                        {
                            "id": so["id"],
                            "number": so["number"],
                            "title": so["title"],
                            "description": (
                                so["description"][:100] + "..."
                                if len(so["description"]) > 100
                                else so["description"]
                            ),
                        }
                        for so in so_details
                        if isinstance(so, dict)
                    ]
            except Exception:
                pass

            sections_payload.append(
                {
                    "id": str(sec.id),
                    "name": sec.name,
                    "courseCode": sec.course.code,
                    "courseName": sec.course.name,
                    "facultyName": build_faculty_name(sec.faculty),
                    "curriculum": sec.course.curriculum.year if sec.course.curriculum else "",
                    "semester": sec.semester or sec.course.semester or "",
                    "schoolYear": sec.academic_year or "",
                    "academicYear": sec.academic_year or "",
                    "students": students,
                    "studentOutcomes": student_outcomes,
                }
            )

        faculty_payload = ClassesFacultySerializer(
            User.objects.filter(role="staff")
            .prefetch_related("assigned_sections__course")
            .order_by("first_name", "last_name", "email"),
            many=True,
        ).data

        return Response({"sections": sections_payload, "faculty": faculty_payload})

    @action(detail=False, methods=["post"], permission_classes=[AllowAny], url_path="bulk_save")
    def bulk_save(self, request):
        sections_data = request.data.get("sections", [])
        faculty_data = request.data.get("faculty", [])
        deleted_faculty_ids = request.data.get("deletedFacultyIds", [])

        if not sections_data and not faculty_data and not deleted_faculty_ids:
            return Response(
                {"detail": "No data provided", "success": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                deleted_faculty_qs = User.objects.filter(id__in=deleted_faculty_ids, role="staff")
                if deleted_faculty_qs.exists():
                    Section.objects.filter(faculty__in=deleted_faculty_qs).update(faculty=None)
                    deleted_faculty_qs.delete()

                valid_school_years = set(SchoolYear.objects.values_list("year", flat=True))
                faculty_email_map = {}

                for fac in faculty_data:
                    email = (fac.get("email") or "").strip().lower()
                    if not email:
                        continue

                    first_name, last_name = split_full_name(fac.get("name", ""))
                    defaults = {
                        "username": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "department": fac.get("department", DEFAULT_DEPARTMENT) or DEFAULT_DEPARTMENT,
                        "role": "staff",
                    }

                    user, created = User.objects.update_or_create(email=email, defaults=defaults)
                    if created or not user.has_usable_password():
                        user.set_password(DEFAULT_FACULTY_PASSWORD)
                        user.save(update_fields=["password"])

                    faculty_email_map[email] = user

                section_faculty = {}
                for fac in faculty_data:
                    user = faculty_email_map.get((fac.get("email") or "").strip().lower())
                    if not user:
                        continue
                    for course_info in fac.get("courses", []):
                        for section_name in course_info.get("sections", []):
                            section_faculty[(section_name, course_info.get("code", ""))] = user

                default_curriculum, _ = Curriculum.objects.get_or_create(year="2025")
                saved_section_ids = set()

                for sec in sections_data:
                    course_code = sec.get("courseCode", "")
                    course, _ = Course.objects.get_or_create(
                        code=course_code,
                        defaults={
                            "name": sec.get("courseName", course_code),
                            "curriculum": default_curriculum,
                            "year_level": "1st Year",
                            "semester": sec.get("semester", "1st Semester") or "1st Semester",
                        },
                    )

                    semester = sec.get("semester")
                    academic_year = sec.get("academicYear", sec.get("schoolYear", ""))

                    if academic_year and academic_year not in valid_school_years:
                        return Response(
                            {"detail": f"Invalid school year: {academic_year}", "success": False},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    section_obj, _ = Section.objects.update_or_create(
                        name=sec["name"],
                        course=course,
                        academic_year=academic_year,
                        semester=semester or "1st Semester",
                        defaults={
                            "faculty": section_faculty.get((sec["name"], course_code)),
                        },
                    )
                    saved_section_ids.add(section_obj.id)

                    saved_enrollment_ids = set()
                    for stu in sec.get("students", []):
                        year_level = 1
                        match = re.search(r"\d+", stu.get("yearLevel", "1"))
                        if match:
                            year_level = int(match.group())

                        name_parts = stu.get("name", "").rsplit(" ", 1)
                        first_name = name_parts[0] if name_parts else ""
                        last_name = name_parts[1] if len(name_parts) > 1 else ""

                        student_obj, _ = Student.objects.update_or_create(
                            student_id=stu["studentId"],
                            defaults={
                                "first_name": first_name,
                                "last_name": last_name,
                                "program": stu.get("course", ""),
                                "year_level": year_level,
                            },
                        )

                        enrollment_obj, _ = Enrollment.objects.update_or_create(
                            student=student_obj,
                            course=course,
                            defaults={"section": section_obj},
                        )
                        saved_enrollment_ids.add(enrollment_obj.id)

                    Enrollment.objects.filter(section=section_obj).exclude(id__in=saved_enrollment_ids).delete()

                stale_sections = Section.objects.exclude(id__in=saved_section_ids)
                Enrollment.objects.filter(section__in=stale_sections).delete()
                stale_sections.delete()

            return Response({"message": "Classes saved successfully", "success": True})

        except Exception as exc:
            return Response(
                {"detail": f"Error saving classes: {str(exc)}", "success": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EnrollmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Enrollment.objects.select_related("student", "section", "course")
    serializer_class = EnrollmentSerializer

    def perform_create(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can manage enrollments.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can manage enrollments.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can manage enrollments.")
        instance.delete()
