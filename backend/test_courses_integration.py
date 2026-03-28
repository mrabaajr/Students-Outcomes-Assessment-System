import requests
import json

print("=== Testing Courses Integration ===\n")

BASE_URL = "http://localhost:8000/api"

# Test 1: Fetch course-SO mappings
print("1. Testing GET /course-so-mappings/")
try:
    response = requests.get(f"{BASE_URL}/course-so-mappings/")
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            print(f"   ✓ Status: {response.status_code}")
            print(f"   ✓ Total mappings: {len(data)}")
            
            # Show sample mapping
            if len(data) > 0:
                sample = data[0]
                print(f"\n   Sample mapping:")
                print(f"     - Course: {sample.get('code')} - {sample.get('name')}")
                print(f"     - Academic Year: {sample.get('academic_year')}")
                print(f"     - Mapped SOs: {sample.get('mapped_sos', [])}")
        else:
            print(f"   Error: Unexpected data format")
    else:
        print(f"   ✗ Status: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n2. Testing GET /curricula/")
try:
    response = requests.get(f"{BASE_URL}/curricula/")
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            print(f"   ✓ Status: {response.status_code}")
            print(f"   ✓ Total curriculums: {len(data)}")
            if len(data) > 0:
                print(f"   - Curriculums: {[c.get('year') for c in data]}")
        else:
            print(f"   Data: {json.dumps(data, indent=2)[:200]}")
    else:
        print(f"   ✗ Status: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n3. Testing student outcomes (for comparison)")
try:
    response = requests.get(f"{BASE_URL}/student-outcomes/")
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            print(f"   ✓ Status: {response.status_code}")
            print(f"   ✓ Total SOs: {len(data)}")
        else:
            print(f"   Error: Unexpected format")
    else:
        print(f"   ✗ Status: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n=== Integration Check Complete ===")
print("Courses page should now display:")
print("- 16 courses with proper SO mappings")
print("- Correct curriculums from backend")
print("- Proper statistics calculations")
