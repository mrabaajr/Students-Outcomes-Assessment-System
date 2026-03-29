from django.db import models
from so.models import StudentOutcome

class Curriculum(models.Model):
    year = models.CharField(max_length=4, unique=True)

    def __str__(self):
        return self.year


class SchoolYear(models.Model):
    year = models.CharField(max_length=9, unique=True)

    class Meta:
        ordering = ['year']
        verbose_name = "Academic Year"
        verbose_name_plural = "Academic Years"

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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']
        verbose_name = "Course"
        verbose_name_plural = "Courses"

    def __str__(self):
        return f"{self.code}: {self.name}"


# New mapping model
class CourseSOMapping(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='so_mappings'
    )
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=255)
    curriculum = models.ForeignKey(
        Curriculum,
        on_delete=models.CASCADE
    )
    year_level = models.CharField(max_length=20)
    semester = models.CharField(max_length=20)
    credits = models.PositiveIntegerField()
    description = models.TextField(blank=True, default='')

    academic_year = models.CharField(
        max_length=9,  # enough to hold "2023-2024"
        default='2023-2024',
        help_text="Academic year for this mapping"
    )

    mapped_sos = models.ManyToManyField(
        StudentOutcome,
        related_name='course_mappings',
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']
        verbose_name = "Course SO Mapping"
        verbose_name_plural = "Course SO Mappings"
        constraints = [
            models.UniqueConstraint(
                fields=['course', 'curriculum', 'academic_year', 'semester'],
                name='unique_course_mapping_per_term',
            )
        ]

    def __str__(self):
        return f"{self.code}: {self.name} ({self.academic_year})"

    
