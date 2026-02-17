from django.db import models
from so.models import StudentOutcome


class Curriculum(models.Model):
    CURRICULUM_CHOICES = [
        ('2018', '2018'),
        ('2023', '2023'),
        ('2025', '2025'),
    ]
    year = models.CharField(max_length=4, choices=CURRICULUM_CHOICES, unique=True)

    def __str__(self):
        return self.year


class Course(models.Model):
    SEMESTER_CHOICES = [
        ('1st Semester', '1st Semester'),
        ('2nd Semester', '2nd Semester'),
        ('Summer', 'Summer'),
    ]

    YEAR_LEVEL_CHOICES = [
        ('1st Year', '1st Year'),
        ('2nd Year', '2nd Year'),
        ('3rd Year', '3rd Year'),
        ('4th Year', '4th Year'),
    ]

    code = models.CharField(max_length=20, help_text="Course code (e.g., CS101)")
    name = models.CharField(max_length=255, help_text="Course name")
    curriculum = models.ForeignKey(
        Curriculum,
        on_delete=models.CASCADE,
        related_name='courses'
    )
    year_level = models.CharField(max_length=20, choices=YEAR_LEVEL_CHOICES)
    semester = models.CharField(max_length=20, choices=SEMESTER_CHOICES, default='1st Semester')
    credits = models.PositiveIntegerField(default=3, help_text="Number of credits")
    description = models.TextField(blank=True, default='', help_text="Course description")

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

    def __str__(self):
        return f"{self.code}: {self.name}"
