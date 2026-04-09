from django.contrib import admin

from .models import Enrollment, Section, Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        "student_id",
        "first_name",
        "last_name",
        "program",
        "year_level",
    )
    search_fields = (
        "student_id",
        "first_name",
        "last_name",
    )
    list_filter = ("program", "year_level")


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "course",
        "faculty",
        "semester",
        "academic_year",
    )
    search_fields = ("name", "course__code", "faculty__email", "faculty__first_name", "faculty__last_name")
    list_filter = ("course", "faculty", "semester", "academic_year")


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "section",
        "course",
        "enrolled_at",
    )
    search_fields = (
        "student__student_id",
        "student__first_name",
        "student__last_name",
    )
    list_filter = ("course", "section")
