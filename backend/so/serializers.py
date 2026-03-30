from rest_framework import serializers
from .models import StudentOutcome, PerformanceIndicator, PerformanceCriterion


# ---------------------------------
# Performance Criterion
# ---------------------------------

class PerformanceCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceCriterion
        fields = (
            "id",
            "name",
            "order",
        )
        read_only_fields = ("id",)


# ---------------------------------
# Performance Indicator
# ---------------------------------

class PerformanceIndicatorSerializer(serializers.ModelSerializer):
    criteria = PerformanceCriterionSerializer(many=True, read_only=True)

    class Meta:
        model = PerformanceIndicator
        fields = (
            "id",
            "number",
            "description",
            "criteria",
        )
        read_only_fields = ("id",)


# ---------------------------------
# Student Outcome
# ---------------------------------

class StudentOutcomeSerializer(serializers.ModelSerializer):
    performance_indicators = PerformanceIndicatorSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = StudentOutcome
        fields = (
            "id",
            "number",
            "title",
            "description",
            "performance_indicators",
        )
        read_only_fields = ("id",)