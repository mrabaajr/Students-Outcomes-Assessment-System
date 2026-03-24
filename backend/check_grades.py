#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assessment.models import Assessment, Grade

# Get assessment for section 9, SO 16
assessment = Assessment.objects.filter(section_id=9, student_outcome_id=16, school_year='2025-2026').first()
if assessment:
    print(f'Assessment: {assessment}')
    grades = assessment.grades.all()
    print(f'Total grades: {grades.count()}')
    for grade in grades:
        print(f'  Student {grade.student_id}, Criterion {grade.criterion_id}: {grade.score}')
else:
    print('No assessment found')
