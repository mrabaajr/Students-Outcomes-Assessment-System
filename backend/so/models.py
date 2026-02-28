from django.db import models


class StudentOutcome(models.Model):
    number = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["number"]

    def __str__(self):
        return f"SO {self.number}: {self.title}"


class PerformanceIndicator(models.Model):
    student_outcome = models.ForeignKey(
        StudentOutcome,
        on_delete=models.CASCADE,
        related_name="performance_indicators"
    )

    number = models.PositiveIntegerField()
    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["student_outcome", "number"]
        unique_together = ("student_outcome", "number")

    def __str__(self):
        return f"SO{self.student_outcome.number} PI{self.number}"


class PerformanceCriterion(models.Model):
    performance_indicator = models.ForeignKey(
        PerformanceIndicator,
        on_delete=models.CASCADE,
        related_name="criteria"
    )

    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["performance_indicator", "order"]
        unique_together = ("performance_indicator", "order")

    def __str__(self):
        return f"{self.performance_indicator} - {self.name}"