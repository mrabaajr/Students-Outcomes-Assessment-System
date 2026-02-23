from rest_framework import serializers
from .models import Student, Section, Enrollment
from users.models import User
from courses.models import Course


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = "__all__"


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'department']


class SectionSerializer(serializers.ModelSerializer):
    faculty = FacultySerializer(read_only=True)
    faculty_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='staff'),
        source='faculty',
        write_only=True
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
            'room',
            'schedule_days',
            'schedule_start',
            'schedule_end',
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