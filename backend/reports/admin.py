from django.contrib import admin

from .models import ReportTemplate


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = (
        "student_outcome",
        "course",
        "section",
        "school_year",
        "updated_at",
    )
    list_filter = ("school_year", "course", "section")
    search_fields = (
        "student_outcome__title",
        "student_outcome__description",
        "course__code",
        "course__name",
        "section__name",
    )
