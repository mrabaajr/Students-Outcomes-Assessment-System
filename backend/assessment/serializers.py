from rest_framework import serializers
from .models import Assessment, Grade


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ('id', 'student', 'criterion', 'performance_indicator', 'score')


class AssessmentSerializer(serializers.ModelSerializer):
    grades = GradeSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = ('id', 'section', 'student_outcome', 'school_year', 'grades', 'created_at')
