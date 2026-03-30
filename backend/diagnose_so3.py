#!/usr/bin/env python
import django
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from so.models import StudentOutcome, PerformanceCriterion, PerformanceIndicator

# Check SO 3 (id 18)
so3 = StudentOutcome.objects.get(id=18)
print(f"SO 3 ({so3.id}): {so3}")
print(f"Number: {so3.number}\n")

# Get all criteria for SO 3
criteria_so3 = PerformanceCriterion.objects.filter(performance_indicator__student_outcome=so3).distinct()
print(f"Criteria in SO 3: {sorted([c.id for c in criteria_so3])}")
for c in criteria_so3:
    print(f"  - Criterion {c.id}: {c.name[:80]}...")

# Check what SO criteria 22, 23 belong to
print(f"\nCriterion 22 belongs to SO: {PerformanceCriterion.objects.get(id=22).performance_indicator.student_outcome}")
print(f"Criterion 23 belongs to SO: {PerformanceCriterion.objects.get(id=23).performance_indicator.student_outcome}")
print(f"Criterion 24 belongs to SO: {PerformanceCriterion.objects.get(id=24).performance_indicator.student_outcome}")

# Check SO 1 (id 16)
so1 = StudentOutcome.objects.get(id=16)
criteria_so1 = PerformanceCriterion.objects.filter(performance_indicator__student_outcome=so1).distinct()
print(f"\nCriteria in SO 1: {sorted([c.id for c in criteria_so1])}")
for c in criteria_so1:
    print(f"  - Criterion {c.id}: {c.name[:80]}...")

# Check PIs involved
print(f"\nPerformance Indicators in SO 1:")
pis_so1 = PerformanceIndicator.objects.filter(student_outcome=so1)
for pi in pis_so1:
    criteria = PerformanceCriterion.objects.filter(performance_indicator=pi)
    print(f"  - PI {pi.id}: {[c.id for c in criteria]}")

print(f"\nPerformance Indicators in SO 3:")
pis_so3 = PerformanceIndicator.objects.filter(student_outcome=so3)
for pi in pis_so3:
    criteria = PerformanceCriterion.objects.filter(performance_indicator=pi)
    print(f"  - PI {pi.id}: {[c.id for c in criteria]}")
