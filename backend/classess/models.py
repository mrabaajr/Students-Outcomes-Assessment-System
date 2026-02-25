# classess/models.py

from django.db import models
from django.conf import settings
from courses.models import Course   # adjust if needed


class Faculty(models.Model):
    """
    Faculty member for the Classes page.
    Stored independently from the auth User model.
    """
    name = models.CharField(max_length=200)
    department = models.CharField(max_length=200, default='Computer Engineering')
    email = models.EmailField(unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Faculty'

    def __str__(self):
        return self.name


class FacultyCourseAssignment(models.Model):
    """
    Maps a faculty member to a course and the sections they teach.
    Sections are stored as a comma-separated string of section names.
    """
    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.CASCADE,
        related_name='course_assignments',
    )
    course_code = models.CharField(max_length=20)
    course_name = models.CharField(max_length=255)
    sections = models.TextField(
        blank=True, default='',
        help_text='Comma-separated section names',
    )

    class Meta:
        unique_together = ('faculty', 'course_code')
        ordering = ['course_code']

    def get_sections_list(self):
        if not self.sections:
            return []
        return [s.strip() for s in self.sections.split(',') if s.strip()]

    def set_sections_list(self, section_names):
        self.sections = ','.join(section_names)

    def __str__(self):
        return f"{self.faculty.name} → {self.course_code}"


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
        on_delete=models.SET_NULL,
        related_name="assigned_sections",
        limit_choices_to={'role': 'staff'},
        blank=True,
        null=True,
    )

    assigned_faculty = models.ForeignKey(
        Faculty,
        on_delete=models.SET_NULL,
        related_name="sections",
        blank=True,
        null=True,
    )

    room = models.CharField(max_length=100, blank=True, default='')

    schedule = models.CharField(max_length=100, blank=True, default='')

    schedule_days = models.CharField(max_length=50, blank=True, default='')
    schedule_start = models.TimeField(blank=True, null=True)
    schedule_end = models.TimeField(blank=True, null=True)

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