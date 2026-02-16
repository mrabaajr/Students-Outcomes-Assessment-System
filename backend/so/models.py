from django.db import models


class StudentOutcome(models.Model):
    """Student Outcome (SO) model - represents program-level learning outcomes"""
    number = models.PositiveIntegerField(help_text="SO number (e.g., 1, 2, 3)")
    title = models.CharField(max_length=255, help_text="Short title for the SO")
    description = models.TextField(help_text="Full description of the student outcome")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['number']
        verbose_name = "Student Outcome"
        verbose_name_plural = "Student Outcomes"

    def __str__(self):
        return f"SO {self.number}: {self.title}"


class PerformanceIndicator(models.Model):
    """Performance Indicator (PI) model - measures specific aspects of a Student Outcome"""
    student_outcome = models.ForeignKey(
        StudentOutcome,
        on_delete=models.CASCADE,
        related_name='performance_indicators'
    )
    number = models.PositiveIntegerField(help_text="PI number within the SO (e.g., 1, 2, 3)")
    description = models.TextField(help_text="Description of what this indicator measures")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['student_outcome', 'number']
        verbose_name = "Performance Indicator"
        verbose_name_plural = "Performance Indicators"
        unique_together = ['student_outcome', 'number']

    def __str__(self):
        return f"SO{self.student_outcome.number} PI{self.number}: {self.description[:50]}"
