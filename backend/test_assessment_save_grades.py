#!/usr/bin/env python
"""
Test Assessment save_grades with proper criteria handling
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_save_grades():
    print("Testing Assessment save_grades with proper criteria...\n")
    
    try:
        # Get SOs
        so_res = requests.get(f"{BASE_URL}/student-outcomes/")
        so_res.raise_for_status()
        sos = so_res.json()
        sos = sos if isinstance(sos, list) else sos.get('results', [])
        
        if not sos:
            print("✗ No SOs found")
            return False
        
        # Find an SO with criteria
        so_with_criteria = None
        for so in sos:
            pis = so.get('performance_indicators', [])
            for pi in pis:
                if pi.get('criteria'):  # Found one with criteria
                    so_with_criteria = so
                    break
            if so_with_criteria:
                break
        
        if not so_with_criteria:
            print("✗ No SO with criteria found")
            return False
        
        print(f"✓ Found SO {so_with_criteria['number']} with criteria")
        
        # Get sections
        sec_res = requests.get(f"{BASE_URL}/sections/load_all/")
        sec_res.raise_for_status()
        sections = sec_res.json().get('sections', [])
        
        if not sections:
            print("✗ No sections found")
            return False
        
        section = sections[0]
        students = section.get('students', [])
        
        if not students:
            print("✗ No students in section")
            return False
        
        print(f"✓ Found section {section['name']} with {len(students)} students")
        
        # Get PI with criteria
        pis = so_with_criteria.get('performance_indicators', [])
        pi_with_criteria = None
        for pi in pis:
            if pi.get('criteria'):
                pi_with_criteria = pi
                break
        
        if not pi_with_criteria:
            print("✗ No PI with criteria found")
            return False
        
        criteria = pi_with_criteria.get('criteria', [])
        print(f"✓ Found PI with {len(criteria)} criteria")
        
        # Build test payload
        test_grades = {}
        for student in students[:1]:  # Test with first student
            test_grades[student['id']] = {}
            for criterion in criteria[:1]:  # Test with first criterion
                test_grades[student['id']][str(criterion['id'])] = 5
        
        print(f"\nTest payload:")
        print(json.dumps({
            'section_id': section['id'],
            'so_id': so_with_criteria['id'],
            'school_year': section.get('schoolYear'),
            'grades': test_grades
        }, indent=2, default=str))
        
        # Save grades
        print("\n\nSaving grades...")
        save_res = requests.post(
            f"{BASE_URL}/assessments/save_grades/",
            json={
                'section_id': section['id'],
                'so_id': so_with_criteria['id'],
                'school_year': section.get('schoolYear', '2025-2026'),
                'grades': test_grades
            }
        )
        save_res.raise_for_status()
        result = save_res.json()
        
        print(f"\nResponse:")
        print(json.dumps(result, indent=2))
        
        if result.get('success'):
            print("\n✓ Save successful!")
            
            # Verify by loading back
            print("\nVerifying by loading grades...")
            load_res = requests.get(
                f"{BASE_URL}/assessments/load_grades/",
                params={
                    'section_id': section['id'],
                    'so_id': so_with_criteria['id'],
                    'school_year': section.get('schoolYear', '2025-2026')
                }
            )
            load_res.raise_for_status()
            loaded = load_res.json()
            
            print(f"Loaded grades: {json.dumps(loaded, indent=2)}")
            return True
        else:
            print(f"\n✗ Save failed: {result}")
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_save_grades()
    exit(0 if success else 1)
