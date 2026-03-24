#!/usr/bin/env python
"""
Quick test of the /api/sections/load_all/ and /api/sections/bulk_save/ endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_load_all():
    """Test GET /api/sections/load_all/"""
    print("\n=== Testing GET /api/sections/load_all/ ===")
    try:
        response = requests.get(f"{BASE_URL}/sections/load_all/")
        response.raise_for_status()
        data = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Sections count: {len(data.get('sections', []))}")
        print(f"Faculty count: {len(data.get('faculty', []))}")
        
        if data.get('sections'):
            print("\nFirst section:")
            print(json.dumps(data['sections'][0], indent=2))
        else:
            print("No sections found in database")
            
        if data.get('faculty'):
            print("\nFirst faculty:")
            print(json.dumps(data['faculty'][0], indent=2))
        else:
            print("No faculty found in database")
            
        return data
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_bulk_save(data):
    """Test POST /api/sections/bulk_save/"""
    print("\n=== Testing POST /api/sections/bulk_save/ ===")
    if not data:
        print("No data to test with")
        return
    
    try:
        response = requests.post(
            f"{BASE_URL}/sections/bulk_save/",
            json=data
        )
        response.raise_for_status()
        result = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(result, indent=2)}")
        return result
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    print("Testing Sections API...")
    data = test_load_all()
    if data:
        test_bulk_save(data)
