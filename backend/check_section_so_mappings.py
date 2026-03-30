#!/usr/bin/env python
"""
Test to see current course-SO mappings for sections
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_course_so_mappings():
    """Get all course-SO mappings"""
    print("\n=== Getting Course-SO Mappings ===")
    try:
        response = requests.get(f"{BASE_URL}/course-so-mappings/")
        response.raise_for_status()
        data = response.json()
        
        if isinstance(data, dict) and 'results' in data:
            mappings = data['results']
        else:
            mappings = data if isinstance(data, list) else []
        
        print(f"Total mappings: {len(mappings)}")
        
        # Group by course
        by_course = {}
        for m in mappings:
            course_code = m.get('course_code') or m.get('courseCode')
            if course_code not in by_course:
                by_course[course_code] = []
            by_course[course_code].append(m)
        
        print(f"\nCourses with mappings:")
        for course, maps in sorted(by_course.items()):
            print(f"  {course}: {len(maps)} student outcomes")
            
        return mappings
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_sections_with_courses():
    """Get sections to see which courses are used"""
    print("\n=== Getting Sections ===")
    try:
        response = requests.get(f"{BASE_URL}/sections/load_all/")
        response.raise_for_status()
        data = response.json()
        
        sections = data.get('sections', [])
        print(f"Total sections: {len(sections)}")
        
        # Group by course
        course_codes = set()
        for s in sections:
            code = s.get('courseCode')
            if code:
                course_codes.add(code)
        
        print(f"Unique course codes in sections: {len(course_codes)}")
        print(f"Courses: {', '.join(sorted(course_codes))}")
        
        return sections
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    print("Checking Course-SO Mappings for Sections...")
    mappings = test_course_so_mappings()
    sections = test_sections_with_courses()
    
    if mappings and sections:
        print("\n=== Analysis ===")
        section_courses = {s['courseCode'] for s in sections}
        mapping_courses = {m.get('course_code') or m.get('courseCode') for m in mappings if m}
        
        print(f"Courses in sections: {len(section_courses)}")
        print(f"Courses with SO mappings: {len(mapping_courses)}")
        print(f"Courses with mappings: {mapping_courses & section_courses}")
        print(f"Courses without mappings: {section_courses - mapping_courses}")
