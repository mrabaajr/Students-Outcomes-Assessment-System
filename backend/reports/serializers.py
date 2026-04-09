from rest_framework import serializers

from .models import ReportTemplate, SemesterArchive


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


class SemesterArchiveSerializer(serializers.ModelSerializer):
    dateSubmitted = serializers.DateTimeField(source="created_at", read_only=True)
    schoolYear = serializers.CharField(source="school_year", read_only=True)
    reportType = serializers.CharField(source="report_type", read_only=True)
    avgScore = serializers.FloatField(source="avg_score", read_only=True)
    coursesAssessed = serializers.IntegerField(source="courses_assessed", read_only=True)
    studentsAssessed = serializers.IntegerField(source="students_assessed", read_only=True)
    generatedBy = serializers.CharField(source="generated_by", read_only=True)
    fileFormat = serializers.CharField(source="file_format", read_only=True)
    soSummaryTables = serializers.SerializerMethodField()

    def get_soSummaryTables(self, obj):
        return (obj.snapshot or {}).get("so_summary_tables", [])

    class Meta:
        model = SemesterArchive
        fields = (
            "id",
            "title",
            "schoolYear",
            "semester",
            "dateSubmitted",
            "reportType",
            "status",
            "coursesAssessed",
            "studentsAssessed",
            "avgScore",
            "fileFormat",
            "generatedBy",
            "summary",
            "highlights",
            "soSummaryTables",
            "sections_archived",
            "snapshot",
        )
