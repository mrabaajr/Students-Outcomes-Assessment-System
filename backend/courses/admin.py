# courses/admin.py
from django.contrib import admin
from .models import Curriculum, Course, CourseSOMapping
from so.models import StudentOutcome


@admin.register(Curriculum)
class CurriculumAdmin(admin.ModelAdmin):
    list_display = ['year']
    ordering = ['year']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'curriculum', 'year_level', 'semester', 'credits']
    list_filter = ['curriculum', 'year_level', 'semester']
    search_fields = ['code', 'name']


@admin.register(CourseSOMapping)
class CourseSOMappingAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'curriculum', 'year_level', 'semester', 'credits']
    list_filter = ['curriculum', 'year_level', 'semester']
    search_fields = ['code', 'name']
    filter_horizontal = ['mapped_sos']  # Makes the M2M field easy to select in the admin
