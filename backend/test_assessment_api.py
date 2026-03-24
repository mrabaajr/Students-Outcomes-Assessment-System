#!/usr/bin/env python
"""
Test Assessment API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_assessment_api():
    print("\n=== Testing Assessment API ===")
    
    # First, get a section to use for testing
    print("\n1. Getting sections...")
    try:
        sections_res = requests.get(f"{BASE_URL}/sections/load_all/")
        sections_res.raise_for_status()
        sections = sections_res.json().get('sections', [])
        
        if sections:
            section = sections[0]
            print(f"✓ Found section: {section['name']} (ID: {section['id']})")
            
            # Get student outcomes
            print("\n2. Getting student outcomes...")
            so_res = requests.get(f"{BASE_URL}/student-outcomes/")
            so_res.raise_for_status()
            sos = so_res.json()
            if isinstance(sos, dict):
                sos = sos.get('results', [])
            else:
                sos = sos if isinstance(sos, list) else []
            
            if sos:
                so = sos[0]
                print(f"✓ Found SO: SO {so['number']} (ID: {so['id']})")
                
                # Test load_grades
                print("\n3. Testing load_grades endpoint...")
                grades_res = requests.get(
                    f"{BASE_URL}/assessments/load_grades/",
                    params={
                        'section_id': section['id'],
                        'so_id': so['id'],
                        'school_year': section.get('schoolYear', '2025-2026')
                    }
                )
                grades_res.raise_for_status()
                grades_data = grades_res.json()
                
                print(f"✓ Load grades response: {json.dumps(grades_data, indent=2)}")
                
                # Test save_grades
                print("\n4. Testing save_grades endpoint...")
                
                # Get students in this section
                students = section.get('students', [])
                if students:
                    # Get performance indicators
                    pi_res = requests.get(f"{BASE_URL}/student-outcomes/{so['id']}/")
                    try:
                        pi_res.raise_for_status()
                        so_full = pi_res.json()
                        pis = so_full.get('performance_indicators', [])
                        
                        if pis:
                            pi = pis[0]
                            # Try to get performance criteria
                            criteria = pi.get('criteria', pi.get('performance_criteria', []))
                            
                            if criteria:
                                criterion = criteria[0]
                                
                                # Build test grades
                                test_grades = {}
                                for student in students[:1]:  # Just test with first student
                                    test_grades[student['id']] = {
                                        str(criterion['id']): 5
                                    }
                                
                                print(f"  Test payload: {json.dumps(test_grades, indent=2)}")
                                
                                save_res = requests.post(
                                    f"{BASE_URL}/assessments/save_grades/",
                                    json={
                                        'section_id': section['id'],
                                        'so_id': so['id'],
                                        'school_year': section.get('schoolYear', '2025-2026'),
                                        'grades': test_grades
                                    }
                                )
                                save_res.raise_for_status()
                                result = save_res.json()
                                
                                print(f"✓ Save grades response: {json.dumps(result, indent=2)}")
                                
                                # Reload grades to verify
                                print("\n5. Verifying saved grades...")
                                reload_res = requests.get(
                                    f"{BASE_URL}/assessments/load_grades/",
                                    params={
                                        'section_id': section['id'],
                                        'so_id': so['id'],
                                        'school_year': section.get('schoolYear', '2025-2026')
                                    }
                                )
                                reload_res.raise_for_status()
                                reload_data = reload_res.json()
                                
                                print(f"✓ Reloaded grades: {json.dumps(reload_data, indent=2)}")
                            else:
                                print("✗ No performance criteria found in SO")
                        else:
                            print("✗ No performance indicators found in SO")
                    except Exception as e:
                        print(f"✗ Error fetching full SO: {e}")
                else:
                    print("✗ No students in section")
        else:
            print("✗ No sections found")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_assessment_api()
