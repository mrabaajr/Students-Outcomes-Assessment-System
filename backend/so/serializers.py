from rest_framework import serializers
from .models import StudentOutcome, PerformanceIndicator


class PerformanceIndicatorSerializer(serializers.ModelSerializer):
    """Serializer for Performance Indicators"""
    class Meta:
        model = PerformanceIndicator
        fields = ('id', 'number', 'description', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class StudentOutcomeSerializer(serializers.ModelSerializer):
    """Serializer for Student Outcomes with nested Performance Indicators"""
    performance_indicators = PerformanceIndicatorSerializer(many=True, read_only=True)
    performanceIndicators = PerformanceIndicatorSerializer(
        many=True, 
        source='performance_indicators',
        read_only=True
    )

    class Meta:
        model = StudentOutcome
        fields = ('id', 'number', 'title', 'description', 'performance_indicators', 
                  'performanceIndicators', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class StudentOutcomeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating Student Outcomes"""
    class Meta:
        model = StudentOutcome
        fields = ('id', 'number', 'title', 'description')
        read_only_fields = ('id',)


class PerformanceIndicatorCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating Performance Indicators"""
    class Meta:
        model = PerformanceIndicator
        fields = ('id', 'student_outcome', 'number', 'description')
        read_only_fields = ('id',)


class BulkStudentOutcomeSerializer(serializers.Serializer):
    """Serializer for bulk save operations from frontend"""
    id = serializers.CharField(required=False, allow_null=True)
    number = serializers.IntegerField()
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    performanceIndicators = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )
