from rest_framework import serializers
from .models import Assessment, Grade
from classess.models import Student
from so.models import PerformanceIndicator


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ["id", "student", "performance_indicator", "score"]


class StudentWithGradesSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    grades = serializers.DictField()


class AssessmentDetailSerializer(serializers.ModelSerializer):
    students = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            "id",
            "section",
            "student_outcome",
            "school_year",
            "students",
        ]

    def get_students(self, obj):
        enrollments = obj.section.enrollments.select_related("student")
        students_data = []

        for enrollment in enrollments:
            student = enrollment.student

            grades = obj.grades.filter(student=student)
            grade_map = {
                g.performance_indicator.id: g.score
                for g in grades
            }

            students_data.append({
                "id": student.id,
                "name": f"{student.first_name} {student.last_name}",
                "grades": grade_map
            })

        return students_data