import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from courses.models import Course, Curriculum, CourseSOMapping
from so.models import StudentOutcome

# Just clear the course-SO mappings but keep courses (they may have sections/enrollments)
print("Clearing existing course-SO mappings...")
CourseSOMapping.objects.all().delete()

# Get all curricula
print("Checking curricula...")
curricula_years = ['2023', '2024', '2025']
curricula = {}
for year in curricula_years:
    curriculum, created = Curriculum.objects.get_or_create(year=year)
    curricula[year] = curriculum
    print(f"  {'Created' if created else 'Found'} curriculum: {year}")

# Get student outcomes
student_outcomes = StudentOutcome.objects.all()
print(f"Found {len(student_outcomes)} student outcomes\n")

# Get all existing courses
all_courses = Course.objects.all()
print(f"Found {len(all_courses)} existing courses\n")

# Create CourseSOMapping entries for all courses
print("Creating course-SO mappings...")
academic_years = ['2023-2024', '2024-2025', '2025-2026']
mappings_created = 0

for academic_year in academic_years:
    for course in all_courses:
        mapping, created = CourseSOMapping.objects.get_or_create(
            course=course,
            curriculum=course.curriculum,
            academic_year=academic_year,
            defaults={
                'code': course.code,
                'name': course.name,
                'year_level': course.year_level,
                'semester': course.semester,
                'credits': course.credits,
                'description': course.description,
            }
        )
        
        if created:
            # Assign some random SOs to the mapping if available
            if student_outcomes:
                # Assign at least one SO to each course, up to 3
                import random
                num_sos = min(random.randint(1, 3), len(student_outcomes))
                sos_to_assign = random.sample(list(student_outcomes), num_sos)
                mapping.mapped_sos.set(sos_to_assign)
                mappings_created += 1
                print(f"  ✓ {course.code} - {academic_year}: Mapped to {num_sos} SO(s)")

print(f"\nSuccessfully created {mappings_created} course-SO mappings")
print(f"\nDatabase state:")
print(f"  - Total Curriculums: {Curriculum.objects.count()}")
print(f"  - Total Courses: {Course.objects.count()}")
print(f"  - Total Course-SO Mappings: {CourseSOMapping.objects.count()}")
print(f"  - Total Student Outcomes: {StudentOutcome.objects.count()}")
