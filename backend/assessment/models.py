from django.db import models
from classess.models import Student, Section
from so.models import StudentOutcome, PerformanceIndicator


class Assessment(models.Model):
    """
    Represents one SO assessment session
    per Section + SO + School Year
    """
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name="assessments"
    )

    student_outcome = models.ForeignKey(
        StudentOutcome,
        on_delete=models.CASCADE,
        related_name="assessments"
    )

    school_year = models.CharField(max_length=20)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("section", "student_outcome", "school_year")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.section} - SO{self.student_outcome.number} ({self.school_year})"


class Grade(models.Model):
    """
    Stores grade per student per PI
    """
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name="grades"
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="so_grades"
    )

    performance_indicator = models.ForeignKey(
        PerformanceIndicator,
        on_delete=models.CASCADE
    )

    score = models.PositiveIntegerField()

    class Meta:
        unique_together = ("assessment", "student", "performance_indicator")

    def __str__(self):
        return f"{self.student} - PI{self.performance_indicator.number}: {self.score}"