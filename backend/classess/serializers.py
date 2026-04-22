from rest_framework import serializers

from users.models import User

from .models import Enrollment, Section, Student


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = "__all__"


class FacultyCourseAssignmentSerializer(serializers.Serializer):
    code = serializers.CharField()
    name = serializers.CharField()
    sections = serializers.ListField(child=serializers.CharField())


class ClassesFacultySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    courses = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name", "department", "email", "role", "courses"]

    def get_name(self, obj):
        return " ".join(part for part in [obj.first_name, obj.last_name] if part).strip() or obj.email

    def get_courses(self, obj):
        assignments = {}
        sections = (
            obj.assigned_sections.select_related("course")
            .order_by("course__code", "name")
        )
        for section in sections:
            course_entry = assignments.setdefault(
                section.course.code,
                {
                    "code": section.course.code,
                    "name": section.course.name,
                    "sections": [],
                },
            )
            course_entry["sections"].append(section.name)

        return list(assignments.values())


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "department"]


class SectionSerializer(serializers.ModelSerializer):
    faculty = FacultySerializer(read_only=True)
    faculty_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=["admin", "staff"]),
        source="faculty",
        write_only=True,
        required=False,
        allow_null=True,
    )
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = [
            "id",
            "name",
            "course",
            "course_code",
            "course_name",
            "faculty",
            "faculty_id",
            "is_active",
            "semester",
            "academic_year",
            "student_count",
        ]

    def get_student_count(self, obj):
        return obj.enrollments.count()


class SectionDetailSerializer(SectionSerializer):
    students = serializers.SerializerMethodField()

    class Meta(SectionSerializer.Meta):
        fields = SectionSerializer.Meta.fields + ["students"]

    def get_students(self, obj):
        enrollments = obj.enrollments.select_related("student")
        return StudentSerializer([e.student for e in enrollments], many=True).data


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ["id", "student", "section"]

    def create(self, validated_data):
        section = validated_data["section"]
        validated_data["course"] = section.course
        return super().create(validated_data)
