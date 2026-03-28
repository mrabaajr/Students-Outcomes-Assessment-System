#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assessment.models import Assessment, Grade
from so.models import PerformanceCriterion

# Get the assessment for section 9, SO 16
assessment = Assessment.objects.filter(section_id=9, student_outcome_id=16, school_year='2025-2026').first()

if assessment:
    # Get criterion 24
    criterion_24 = PerformanceCriterion.objects.get(id=24)
    print(f'Criterion 24 belongs to: {criterion_24.performance_indicator} (PI {criterion_24.performance_indicator_id})')
    
    # Delete grades for criterion 24 from this assessment
    bad_grades = Grade.objects.filter(assessment=assessment, criterion_id=24)
    count = bad_grades.count()
    print(f'Deleting {count} bad grades (criterion 24 for SO 16)...')
    bad_grades.delete()
    
    # Verify
    remaining = assessment.grades.all().count()
    print(f'Remaining grades in assessment: {remaining}')
    for grade in assessment.grades.all():
        print(f'  Student {grade.student_id}, Criterion {grade.criterion_id}: {grade.score}')
else:
    print('Assessment not found')
