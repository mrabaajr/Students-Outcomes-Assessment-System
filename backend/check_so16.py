#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from so.models import StudentOutcome, PerformanceIndicator, PerformanceCriterion

so = StudentOutcome.objects.get(id=16)
print(f'SO: {so}')
print(f'PIs:')

pis = so.performance_indicators.all()
for pi in pis:
    criteria = pi.criteria.all()
    print(f'  PI {pi.id} ({pi.number}): {pi.description}')
    print(f'    Criteria count: {criteria.count()}')
    for pc in criteria:
        print(f'      - {pc.id}: {pc.name}')
