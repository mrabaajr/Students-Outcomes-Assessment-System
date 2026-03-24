#!/usr/bin/env python
"""
Check the structure of course-SO mappings
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_course_so_mappings():
    """Get all course-SO mappings with details"""
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
        
        if mappings:
            print("\nFirst mapping structure:")
            print(json.dumps(mappings[0], indent=2, default=str))
            
            print("\nSample mappings (first 3):")
            for i, m in enumerate(mappings[:3]):
                print(f"\n{i+1}. {json.dumps(m, indent=2, default=str)}")
        
        return mappings
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("Checking Course-SO Mappings structure...")
    mappings = test_course_so_mappings()
