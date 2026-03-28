#!/usr/bin/env python
"""
Check Student Outcome structure with performance indicators and criteria
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def check_so_structure():
    print("\n=== Checking Student Outcome Structure ===")
    
    # Get SOs
    print("\n1. Getting all student outcomes...")
    so_res = requests.get(f"{BASE_URL}/student-outcomes/")
    so_res.raise_for_status()
    
    data = so_res.json()
    sos = data if isinstance(data, list) else data.get('results', [])
    
    if sos:
        so = sos[0]
        print(f"\nFirst SO (ID: {so['id']}):")
        print(json.dumps(so, indent=2, default=str)[:1000] + "...")
        
        # Check structure
        print("\n\nAnalysis:")
        print(f"Has 'performance_indicators': {'performance_indicators' in so}")
        print(f"Has 'performanceIndicators': {'performanceIndicators' in so}")
        
        if 'performance_indicators' in so:
            pis = so['performance_indicators']
            print(f"Number of performance indicators: {len(pis)}")
            if pis:
                pi = pis[0]
                print(f"\nFirst PI structure:")
                print(json.dumps(pi, indent=2, default=str)[:500] + "...")
                print(f"\nHas 'criteria': {'criteria' in pi}")
                print(f"Has 'performance_criteria': {'performance_criteria' in pi}")
                print(f"Has 'performanceCriteria': {'performanceCriteria' in pi}")

if __name__ == "__main__":
    check_so_structure()
