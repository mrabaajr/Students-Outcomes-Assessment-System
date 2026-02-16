from django.db import models
from so.models import StudentOutcome


class Course(models.Model):
    """Course model with Student Outcome mappings"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    SEMESTER_CHOICES = [
        ('1st Semester', '1st Semester'),
        ('2nd Semester', '2nd Semester'),
        ('Summer', 'Summer'),
    ]
    
    code = models.CharField(max_length=20, help_text="Course code (e.g., CS101)")
    name = models.CharField(max_length=255, help_text="Course name")
    section = models.CharField(max_length=10, blank=True, default='', help_text="Section (e.g., A, B)")
    department = models.CharField(max_length=100, help_text="Department name")
    description = models.TextField(blank=True, default='', help_text="Course description")
    credits = models.PositiveIntegerField(default=3, help_text="Number of credits")
    semester = models.CharField(max_length=20, choices=SEMESTER_CHOICES, default='1st Semester')
    academic_year = models.CharField(max_length=20, help_text="Academic year (e.g., 2024-2025)")
    instructor = models.CharField(max_length=255, blank=True, default='', help_text="Instructor name")
    student_count = models.PositiveIntegerField(default=0, help_text="Number of enrolled students")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Many-to-many relationship with StudentOutcome
    mapped_sos = models.ManyToManyField(
        StudentOutcome,
        related_name='courses',
        blank=True,
        help_text="Student Outcomes mapped to this course"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']
        verbose_name = "Course"
        verbose_name_plural = "Courses"
        unique_together = ['code', 'section', 'academic_year']

    def __str__(self):
        section_str = f" - {self.section}" if self.section else ""
        return f"{self.code}{section_str}: {self.name}"
