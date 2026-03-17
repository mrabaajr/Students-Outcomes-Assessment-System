from rest_framework import serializers
from .models import Student, Section, Enrollment, Faculty, FacultyCourseAssignment
from users.models import User
from courses.models import Course


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = "__all__"


class FacultyCourseAssignmentSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()

    class Meta:
        model = FacultyCourseAssignment
        fields = ['id', 'course_code', 'course_name', 'sections']

    def get_sections(self, obj):
        return obj.get_sections_list()


class ClassesFacultySerializer(serializers.ModelSerializer):
    courses = FacultyCourseAssignmentSerializer(
        source='course_assignments', many=True, read_only=True
    )

    class Meta:
        model = Faculty
        fields = ['id', 'name', 'department', 'email', 'courses']


# Keep old FacultySerializer for SectionSerializer compatibility
class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'department']


class SectionSerializer(serializers.ModelSerializer):
    faculty = FacultySerializer(read_only=True)
    faculty_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='staff'),
        source='faculty',
        write_only=True,
        required=False,
        allow_null=True,
    )

    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = [
            'id',
            'name',
            'course',
            'course_code',
            'course_name',
            'faculty',
            'faculty_id',
            'semester',
            'academic_year',
            'student_count',
        ]

    def get_student_count(self, obj):
        return obj.enrollments.count()
    
class SectionDetailSerializer(SectionSerializer):
    students = serializers.SerializerMethodField()

    class Meta(SectionSerializer.Meta):
        fields = SectionSerializer.Meta.fields + ['students']

    def get_students(self, obj):
        enrollments = obj.enrollments.select_related('student')
        return StudentSerializer(
            [e.student for e in enrollments],
            many=True
        ).data
    

class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'section']

    def create(self, validated_data):
        section = validated_data['section']
        validated_data['course'] = section.course
        return super().create(validated_data)
