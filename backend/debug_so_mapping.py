#!/usr/bin/env python
"""
Debug why section SO mappings are empty
"""

import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from courses.models import Course, CourseSOMapping
from classess.models import Section

print("Checking course-SO mapping structure...")

# Get a section
section = Section.objects.first()
if section:
    print(f"\nSection: {section.name}")
    print(f"Course: {section.course.code}")
    print(f"Academic Year: {section.academic_year}")
    
    # Get mapping for this course-year combo
    mapping = CourseSOMapping.objects.filter(
        course=section.course,
        academic_year=section.academic_year
    ).first()
    
    if mapping:
        print(f"\nMapping found!")
        print(f"Mapped SOs: {mapping.mapped_sos}")
        print(f"Has mapped_sos_details: {hasattr(mapping, 'mapped_sos_details')}")
        
        if hasattr(mapping, 'mapped_sos_details'):
            print(f"Type of mapped_sos_details: {type(mapping.mapped_sos_details)}")
            print(f"First SO detail: {mapping.mapped_sos_details[0] if mapping.mapped_sos_details else 'empty'}")
    else:
        print(f"\nNo mapping found for {section.course.code} - {section.academic_year}")
        
        # List all mappings for this course
        all_mappings = CourseSOMapping.objects.filter(course=section.course)
        print(f"\nMappings for {section.course.code}:")
        for m in all_mappings:
            print(f"  - {m.academic_year}: {m.mapped_sos}")

# Check all unique course-year combos in sections
print("\n\nAll section course-year combos:")
section_combos = Section.objects.values('course__code', 'academic_year').distinct()
for combo in section_combos:
    course_code = combo['course__code']
    year = combo['academic_year']
    
    mapping = CourseSOMapping.objects.filter(
        course__code=course_code,
        academic_year=year
    ).first()
    
    if mapping:
        print(f"✓ {course_code} ({year}): {len(mapping.mapped_sos)} outcomes")
    else:
        print(f"✗ {course_code} ({year}): NO MAPPING")
