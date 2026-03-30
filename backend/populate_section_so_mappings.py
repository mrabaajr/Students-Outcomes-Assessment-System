#!/usr/bin/env python
"""
Populate Course-StudentOutcome mappings for courses used in sections
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from courses.models import Course, CourseSOMapping
from so.models import StudentOutcome

def populate_mappings():
    """Create mappings for existing courses and student outcomes"""
    print("Populating Course-StudentOutcome mappings...")
    
    # Get all courses
    courses = Course.objects.all()
    print(f"Found {courses.count()} courses")
    
    # Get all student outcomes
    outcomes = StudentOutcome.objects.all()
    print(f"Found {outcomes.count()} student outcomes")
    
    if not outcomes.exists():
        print("No student outcomes found. Create some first.")
        return
    
    if not courses.exists():
        print("No courses found. Create some first.")
        return
    
    # Create mappings for each course-academic_year combination
    mapping_count = 0
    for course in courses:
        # Create mappings for multiple academic years
        for academic_year in ['2023-2024', '2024-2025', '2025-2026']:
            # Skip if already exists
            if CourseSOMapping.objects.filter(
                course=course,
                academic_year=academic_year
            ).exists():
                continue
            
            # Assign random outcomes to this course
            assigned_outcomes = outcomes.order_by('?')[:2]  # Pick 2 random outcomes
            
            mapping, created = CourseSOMapping.objects.update_or_create(
                course=course,
                academic_year=academic_year,
                defaults={
                    'mapped_sos': [so.id for so in assigned_outcomes],
                }
            )
            
            if created:
                mapping_count += 1
                print(f"✓ Created mapping: {course.code} ({academic_year}) → {', '.join(f'SO{so.number}' for so in assigned_outcomes)}")
    
    print(f"\nTotal new mappings created: {mapping_count}")

if __name__ == "__main__":
    populate_mappings()
