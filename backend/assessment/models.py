from django.db import models
from django.db.models import Q
from classess.models import Student, Section
from so.models import StudentOutcome, PerformanceCriterion, PerformanceIndicator


class Assessment(models.Model):
    """
    Represents one SO assessment session
    for a specific Section and School Year.
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
        ordering = ["-updated_at", "-created_at"]

    def __str__(self):
        return f"{self.section} - SO{self.student_outcome.number} ({self.school_year})"


class Grade(models.Model):
    """
    Grade per student per Performance Criterion or
    Performance Indicator within an Assessment.
    """

    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name="grades"
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="criterion_grades"
    )

    criterion = models.ForeignKey(
        PerformanceCriterion,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="grades"
    )

    performance_indicator = models.ForeignKey(
        PerformanceIndicator,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="grades"
    )

    score = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["assessment", "student", "criterion"],
                condition=Q(criterion__isnull=False),
                name="unique_grade_per_criterion",
            ),
            models.UniqueConstraint(
                fields=["assessment", "student", "performance_indicator"],
                condition=Q(performance_indicator__isnull=False),
                name="unique_grade_per_indicator",
            ),
        ]

    def __str__(self):
        basis = self.criterion.name if self.criterion else self.performance_indicator.description
        return f"{self.student} - {basis}: {self.score}"
