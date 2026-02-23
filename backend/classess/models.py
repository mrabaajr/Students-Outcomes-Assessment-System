# classess/models.py

from django.db import models
from django.conf import settings
from courses.models import Course   # adjust if needed


class Student(models.Model):
    student_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    program = models.CharField(max_length=100)  # BSIT, BSCS, etc
    year_level = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"
    

class Section(models.Model):
    name = models.CharField(max_length=50)  # CPE32S1
    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name="sections"
    )

    faculty = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="assigned_sections",
        limit_choices_to={'role': 'staff'}  # Only faculty selectable
    )

    room = models.CharField(max_length=100)

    schedule_days = models.CharField(max_length=50)  # MWF / TTH
    schedule_start = models.TimeField()
    schedule_end = models.TimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('name', 'course')
        ordering = ['course', 'name']

    def __str__(self):
        return f"{self.course.code} - {self.name}"
    

class Enrollment(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="enrollments"
    )

    section = models.ForeignKey(
        Section,
        on_delete=models.PROTECT,
        related_name="enrollments"
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT
    )

    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')
        ordering = ['student']

    def save(self, *args, **kwargs):
        # Auto-assign course from section
        self.course = self.section.course
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} → {self.section}"