from django.db import models
from classess.models import Student, Section
from so.models import StudentOutcome, PerformanceCriterion


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

    class Meta:
        unique_together = ("section", "student_outcome", "school_year")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.section} - SO{self.student_outcome.number} ({self.school_year})"


class Grade(models.Model):
    """
    Grade per student per Performance Criterion
    within an Assessment.
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
        related_name="grades"
    )

    score = models.PositiveIntegerField()

    class Meta:
        unique_together = ("assessment", "student", "criterion")

    def __str__(self):
        return f"{self.student} - {self.criterion.name}: {self.score}"