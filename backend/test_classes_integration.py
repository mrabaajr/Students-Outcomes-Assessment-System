#!/usr/bin/env python
"""
Comprehensive test for Classes page integration
Tests data flow from backend API to ensure Classes page works correctly
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_load_all_complete():
    """Test GET /api/sections/load_all/ with complete data"""
    print("\n=== Test 1: GET /api/sections/load_all/ ===")
    try:
        response = requests.get(f"{BASE_URL}/sections/load_all/")
        response.raise_for_status()
        data = response.json()
        
        sections = data.get('sections', [])
        faculty = data.get('faculty', [])
        
        print(f"✓ Status: 200 OK")
        print(f"✓ Sections: {len(sections)}")
        print(f"✓ Faculty: {len(faculty)}")
        
        # Check section structure
        if sections:
            section = sections[0]
            required_fields = ['id', 'name', 'courseCode', 'courseName', 'students', 'studentOutcomes']
            missing = [f for f in required_fields if f not in section]
            if missing:
                print(f"✗ Missing fields in section: {missing}")
                return False
            print(f"✓ Section has all required fields")
            
            # Check if StudentOutcomes are populated
            sos_populated = any(s.get('studentOutcomes') for s in sections)
            if sos_populated:
                print(f"✓ StudentOutcomes data populated in sections")
            else:
                print(f"⚠ Some sections have no StudentOutcomes (expected if no mappings)")
        
        # Check faculty structure
        if faculty:
            fac = faculty[0]
            required_fields = ['id', 'name', 'email', 'department', 'courses']
            missing = [f for f in required_fields if f not in fac]
            if missing:
                print(f"✗ Missing fields in faculty: {missing}")
                return False
            print(f"✓ Faculty has all required fields")
        
        return data
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_bulk_save(data):
    """Test POST /api/sections/bulk_save/"""
    print("\n=== Test 2: POST /api/sections/bulk_save/ ===")
    if not data:
        print("⚠ Skipping bulk_save test (no data)")
        return False
    
    try:
        # Make minimal change to test save capability
        sections = data.get('sections', [])
        if sections and sections[0].get('students'):
            # Just resave the same data
            response = requests.post(
                f"{BASE_URL}/sections/bulk_save/",
                json={
                    'sections': data.get('sections', []),
                    'faculty': data.get('faculty', []),
                }
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                print(f"✓ Status: 200 OK")
                print(f"✓ Save successful: {result.get('message')}")
                return True
            else:
                print(f"✗ Save failed: {result}")
                return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_data_relationships():
    """Test relationships between sections, courses, and StudentOutcomes"""
    print("\n=== Test 3: Data Relationships ===")
    try:
        # Get sections data
        sections_resp = requests.get(f"{BASE_URL}/sections/load_all/")
        sections_resp.raise_for_status()
        sections = sections_resp.json().get('sections', [])
        
        # Get course-SO mappings
        mappings_resp = requests.get(f"{BASE_URL}/course-so-mappings/")
        mappings_resp.raise_for_status()
        mappings_data = mappings_resp.json()
        mappings = mappings_data.get('results', []) if isinstance(mappings_data, dict) else mappings_data
        
        # Group mappings by course code
        mappings_by_course = {}
        for m in mappings:
            code = m.get('code')
            if code:
                if code not in mappings_by_course:
                    mappings_by_course[code] = []
                mappings_by_course[code].append(m)
        
        # Check consistency
        sections_with_sos = 0
        sections_without_sos = 0
        
        for section in sections:
            course_code = section.get('courseCode')
            sos = section.get('studentOutcomes', [])
            
            if sos:
                sections_with_sos += 1
            else:
                sections_without_sos += 1
            
            # Check if mapping exists
            has_mapping = course_code in mappings_by_course
            has_sos_data = len(sos) > 0
            
            if has_mapping and not has_sos_data:
                print(f"⚠ Section '{section['name']}' ({course_code}) has mapping but no SO data")
        
        print(f"✓ Sections with StudentOutcomes: {sections_with_sos}")
        print(f"✓ Sections without StudentOutcomes: {sections_without_sos}")
        print(f"✓ Unique courses in mappings: {len(mappings_by_course)}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def run_all_tests():
    """Run all integration tests"""
    print("=" * 60)
    print("Classes Page Integration Tests")
    print("=" * 60)
    
    results = []
    
    # Test 1: Load all data
    data = test_load_all_complete()
    results.append(("Load All Data", data is not None))
    
    # Test 2: Bulk save
    if data:
        results.append(("Bulk Save", test_bulk_save(data)))
    
    # Test 3: Data relationships
    results.append(("Data Relationships", test_data_relationships()))
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(result[1] for result in results)
    print("\n" + ("✓ ALL TESTS PASSED" if all_passed else "✗ SOME TESTS FAILED"))
    
    return all_passed

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
