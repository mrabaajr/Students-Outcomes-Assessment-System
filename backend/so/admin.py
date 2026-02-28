from django.contrib import admin
from .models import StudentOutcome, PerformanceIndicator, PerformanceCriterion


class PerformanceCriterionInline(admin.TabularInline):
    model = PerformanceCriterion
    extra = 1


class PerformanceIndicatorInline(admin.TabularInline):
    model = PerformanceIndicator
    extra = 1


@admin.register(StudentOutcome)
class StudentOutcomeAdmin(admin.ModelAdmin):
    list_display = ("number", "title")
    inlines = [PerformanceIndicatorInline]


@admin.register(PerformanceIndicator)
class PerformanceIndicatorAdmin(admin.ModelAdmin):
    list_display = ("student_outcome", "number", "description")
    inlines = [PerformanceCriterionInline]


@admin.register(PerformanceCriterion)
class PerformanceCriterionAdmin(admin.ModelAdmin):
    list_display = ("performance_indicator", "name", "order")