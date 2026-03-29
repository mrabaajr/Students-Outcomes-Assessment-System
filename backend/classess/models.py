# classess/models.py

from django.conf import settings
from django.db import models

from courses.models import Course


class Student(models.Model):
    student_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    program = models.CharField(max_length=100)
    year_level = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"


class Section(models.Model):
    name = models.CharField(max_length=50)
    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name="sections",
    )
    faculty = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="assigned_sections",
        limit_choices_to={"role": "staff"},
        blank=True,
        null=True,
    )
    semester = models.CharField(max_length=20, blank=True, default="")
    academic_year = models.CharField(max_length=20, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("name", "course", "academic_year", "semester")
        ordering = ["course", "name"]

    def __str__(self):
        return f"{self.course.code} - {self.name}"


class Enrollment(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="enrollments",
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.PROTECT,
        related_name="enrollments",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "course")
        ordering = ["student"]

    def save(self, *args, **kwargs):
        self.course = self.section.course
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} -> {self.section}"
