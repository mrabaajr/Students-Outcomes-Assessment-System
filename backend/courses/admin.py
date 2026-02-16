from django.contrib import admin
from .models import Course


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'section', 'department', 'semester', 'academic_year', 'status', 'student_count')
    list_filter = ('department', 'semester', 'academic_year', 'status')
    search_fields = ('code', 'name', 'description')
    ordering = ('code',)
    filter_horizontal = ('mapped_sos',)
