from django.contrib import admin
from .models import Assessment, Grade


class GradeInline(admin.TabularInline):
    model = Grade
    extra = 0


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("section", "student_outcome", "school_year", "created_at", "updated_at")
    list_filter = ("section", "student_outcome", "school_year")
    readonly_fields = ("created_at", "updated_at")
    inlines = [GradeInline]


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = (
        "assessment",
        "student",
        "student_outcome",
        "performance_indicator",
        "criterion",
        "score",
    )

    list_filter = (
        "assessment",
        "criterion__performance_indicator",
        "criterion__performance_indicator__student_outcome",
    )

    search_fields = (
        "student__first_name",
        "student__last_name",
        "criterion__name",
    )

    def performance_indicator(self, obj):
        return obj.criterion.performance_indicator if obj.criterion else obj.performance_indicator

    performance_indicator.short_description = "Performance Indicator"

    def student_outcome(self, obj):
        indicator = obj.criterion.performance_indicator if obj.criterion else obj.performance_indicator
        return indicator.student_outcome if indicator else None

    student_outcome.short_description = "Student Outcome"
