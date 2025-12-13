from django.contrib import admin
from .models import LearningOutcome, Assessment, AssessmentResult

@admin.register(LearningOutcome)
class LearningOutcomeAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'description')

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'learning_outcome', 'created_by', 'assessment_date')
    list_filter = ('assessment_date', 'created_at')
    search_fields = ('title', 'description')

@admin.register(AssessmentResult)
class AssessmentResultAdmin(admin.ModelAdmin):
    list_display = ('assessment', 'student', 'score', 'created_at')
    list_filter = ('score', 'created_at')
    search_fields = ('assessment__title', 'student__email')
