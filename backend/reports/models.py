from django.db import models

from courses.models import Course
from classess.models import Section
from so.models import StudentOutcome


class ReportTemplate(models.Model):
    student_outcome = models.ForeignKey(
        StudentOutcome,
        on_delete=models.CASCADE,
        related_name="report_templates",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="report_templates",
        blank=True,
        null=True,
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name="report_templates",
        blank=True,
        null=True,
    )
    school_year = models.CharField(max_length=20, blank=True, default="")
    formula = models.TextField(
        default="(got80OrHigher / studentsAnswered) * distribution"
    )
    variables = models.JSONField(default=list, blank=True)
    table_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["student_outcome__number", "course__code", "section__name", "school_year"]
        constraints = [
            models.UniqueConstraint(
                fields=["student_outcome", "course", "section", "school_year"],
                name="unique_report_template_scope",
            )
        ]

    def __str__(self):
        scope = []
        if self.course_id:
            scope.append(self.course.code)
        if self.section_id:
            scope.append(self.section.name)
        if self.school_year:
            scope.append(self.school_year)
        scope_label = " / ".join(scope) if scope else "all filters"
        return f"SO {self.student_outcome.number} report ({scope_label})"
