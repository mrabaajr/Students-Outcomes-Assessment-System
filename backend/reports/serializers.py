from rest_framework import serializers

from .models import ReportTemplate


class ReportTemplateSerializer(serializers.ModelSerializer):
    so_id = serializers.IntegerField(source="student_outcome_id", read_only=True)
    course_id = serializers.IntegerField(read_only=True)
    section_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ReportTemplate
        fields = (
            "id",
            "so_id",
            "course_id",
            "section_id",
            "school_year",
            "formula",
            "variables",
            "table_data",
            "updated_at",
        )
