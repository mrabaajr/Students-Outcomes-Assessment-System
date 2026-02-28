from django.contrib import admin
from .models import Assessment, Grade


class GradeInline(admin.TabularInline):
    model = Grade
    extra = 0
    min_num = 0


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("section", "student_outcome", "school_year", "created_at")
    list_filter = ("section", "student_outcome", "school_year")
    search_fields = ("section__name",)
    inlines = [GradeInline]


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ("assessment", "student", "performance_indicator", "score")
    list_filter = ("assessment", "performance_indicator")