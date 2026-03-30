from django.contrib import admin
from .models import Course, Curriculum, CourseSOMapping, SchoolYear

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'curriculum', 'year_level', 'semester', 'credits')
    list_filter = ('curriculum', 'year_level', 'semester')
    search_fields = ('code', 'name')

@admin.register(Curriculum)
class CurriculumAdmin(admin.ModelAdmin):
    list_display = ('year',)
    search_fields = ('year',)

@admin.register(SchoolYear)
class SchoolYearAdmin(admin.ModelAdmin):
    list_display = ('year',)
    search_fields = ('year',)
    ordering = ('year',)

@admin.register(CourseSOMapping)
class CourseSOMappingAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'course', 'curriculum', 'year_level', 'semester', 'credits', 'academic_year')
    list_filter = ('curriculum', 'year_level', 'semester', 'academic_year')
    search_fields = ('code', 'name', 'course__code', 'course__name')
    filter_horizontal = ('mapped_sos',)  # makes the many-to-many field easier to manage
