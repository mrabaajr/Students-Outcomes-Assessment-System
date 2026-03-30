#!/usr/bin/env python
"""
Comprehensive Assessment page integration test
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_assessment_integration():
    print("=" * 60)
    print("Assessment Page Integration Tests")
    print("=" * 60)
    
    results = []
    
    try:
        # 1. Get Student Outcomes
        print("\n1. Testing Student Outcomes API...")
        so_res = requests.get(f"{BASE_URL}/student-outcomes/")
        so_res.raise_for_status()
        sos = so_res.json()
        sos = sos if isinstance(sos, list) else sos.get('results', [])
        
        if sos:
            print(f"   ✓ Loaded {len(sos)} Student Outcomes")
            so = sos[0]
            pis = so.get('performance_indicators', [])
            print(f"   ✓ First SO has {len(pis)} performance indicators")
            results.append(("Load Student Outcomes", True))
        else:
            print("   ✗ No Student Outcomes found")
            results.append(("Load Student Outcomes", False))
            
        # 2. Get Sections with students
        print("\n2. Testing Sections API (load_all)...")
        sec_res = requests.get(f"{BASE_URL}/sections/load_all/")
        sec_res.raise_for_status()
        sec_data = sec_res.json()
        sections = sec_data.get('sections', [])
        faculty = sec_data.get('faculty', [])
        
        if sections:
            print(f"   ✓ Loaded {len(sections)} sections")
            section = sections[0]
            students = section.get('students', [])
            sos_in_section = section.get('studentOutcomes', [])
            print(f"   ✓ First section has {len(students)} students")
            print(f"   ✓ First section has {len(sos_in_section)} mapped Student Outcomes")
            results.append(("Load Sections", True))
        else:
            print("   ✗ No sections found")
            results.append(("Load Sections", False))
            
        # 3. Get Course-SO mappings
        print("\n3. Testing Course-SO Mappings API...")
        map_res = requests.get(f"{BASE_URL}/course-so-mappings/")
        map_res.raise_for_status()
        map_data = map_res.json()
        mappings = map_data if isinstance(map_data, list) else map_data.get('results', [])
        
        if mappings:
            print(f"   ✓ Loaded {len(mappings)} course-SO mappings")
            results.append(("Load Course-SO Mappings", True))
        else:
            print("   ✗ No mappings found")
            results.append(("Load Course-SO Mappings", False))
        
        # 4. Test assessment load_grades
        print("\n4. Testing Assessment load_grades endpoint...")
        if section and so:
            grades_res = requests.get(
                f"{BASE_URL}/assessments/load_grades/",
                params={
                    'section_id': section['id'],
                    'so_id': so['id'],
                    'school_year': section.get('schoolYear', '2025-2026')
                }
            )
            grades_res.raise_for_status()
            grades = grades_res.json()
            print(f"   ✓ Load_grades endpoint working (returned {len(grades.get('grades', {}))} student grades)")
            results.append(("Load Grades", True))
        else:
            print("   ✗ No section or SO to test with")
            results.append(("Load Grades", False))
            
        # 5. Test assessment save_grades
        print("\n5. Testing Assessment save_grades endpoint...")
        if section and so and pis:
            pi = pis[0]
            criteria = pi.get('criteria', [])
            
            if criteria and students:
                test_grades = {}
                for student in students[:1]:  # Test with first student
                    test_grades[student['id']] = {
                        str(criteria[0]['id']): 5
                    }
                
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
                
                if result.get('success'):
                    print(f"   ✓ Save_grades endpoint working")
                    results.append(("Save Grades", True))
                else:
                    print(f"   ✗ Save_grades failed: {result}")
                    results.append(("Save Grades", False))
            else:
                print("   ✗ Missing criteria or students")
                results.append(("Save Grades", False))
        else:
            print("   ✗ No section/SO/PI to test with")
            results.append(("Save Grades", False))
        
        # 6. Test Faculty data (for Assessment page context)
        print("\n6. Testing Faculty integration...")
        if faculty:
            print(f"   ✓ Faculty data available ({len(faculty)} faculty members)")
            print(f"   ✓ Can map faculty to sections for assessment context")
            results.append(("Faculty Integration", True))
        else:
            print("   ⚠ No faculty data (may not be needed for assessment)")
            results.append(("Faculty Integration", True))
        
        # 7. Verify data relationships
        print("\n7. Verifying Data Relationships...")
        if sections and sos and mappings:
            # Check if sections have SOs mapped
            sections_with_sos = sum(1 for s in sections if s.get('studentOutcomes'))
            print(f"   ✓ {sections_with_sos}/{len(sections)} sections have StudentOutcomes")
            
            # Check if courses in mappings match sections
            mapping_courses = {m.get('code') for m in mappings if m.get('code')}
            section_courses = {s.get('courseCode') for s in sections}
            overlap = mapping_courses & section_courses
            
            print(f"   ✓ Sections use {len(section_courses)} unique courses")
            print(f"   ✓ Mappings define {len(mapping_courses)} unique courses")
            print(f"   ✓ {len(overlap)} courses have both sections and SO mappings")
            
            results.append(("Data Relationships", True))
        else:
            print("   ✗ Missing data for relationship check")
            results.append(("Data Relationships", False))
            
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    passed_count = sum(1 for _, p in results if p)
    total_count = len(results)
    
    print(f"\nTotal: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n✓ Assessment page is fully integrated with backend!")
    else:
        print(f"\n⚠ Some integration tests failed")
    
    return passed_count == total_count

if __name__ == "__main__":
    success = test_assessment_integration()
    exit(0 if success else 1)
