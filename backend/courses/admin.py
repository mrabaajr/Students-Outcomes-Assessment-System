from django.contrib import admin
from .models import Course, Curriculum

@admin.register(Curriculum)
class CurriculumAdmin(admin.ModelAdmin):
    list_display = ['year']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = [
        'code',
        'name',
        'curriculum',   # FK to Curriculum
        'year_level',
        'semester',
        'credits',
    ]
    list_filter = [
        'curriculum',
        'year_level',
        'semester',
    ]
    search_fields = ['code', 'name']
