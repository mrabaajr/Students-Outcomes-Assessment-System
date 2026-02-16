from django.contrib import admin
from .models import StudentOutcome, PerformanceIndicator


class PerformanceIndicatorInline(admin.TabularInline):
    model = PerformanceIndicator
    extra = 1


@admin.register(StudentOutcome)
class StudentOutcomeAdmin(admin.ModelAdmin):
    list_display = ('number', 'title', 'description', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'description')
    ordering = ('number',)
    inlines = [PerformanceIndicatorInline]


@admin.register(PerformanceIndicator)
class PerformanceIndicatorAdmin(admin.ModelAdmin):
    list_display = ('student_outcome', 'number', 'description', 'created_at')
    list_filter = ('student_outcome', 'created_at')
    search_fields = ('description',)
    ordering = ('student_outcome', 'number')
