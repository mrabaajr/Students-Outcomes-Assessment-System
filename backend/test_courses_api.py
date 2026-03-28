import requests
import json

# Test courses API

print("=== Testing Courses API ===\n")

BASE_URL = "http://localhost:8000/api"

# Test 1: Get all courses
print("1. Testing GET /courses/")
try:
    response = requests.get(f"{BASE_URL}/courses/")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Status: {response.status_code}")
        print(f"   ✓ Number of courses: {len(data)}")
        if len(data) > 0:
            print(f"   - First course: {data[0]}")
    else:
        print(f"   ✗ Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n2. Testing GET /course-so-mappings/")
try:
    response = requests.get(f"{BASE_URL}/course-so-mappings/")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Status: {response.status_code}")
        print(f"   ✓ Number of course-SO mappings: {len(data)}")
        if len(data) > 0:
            print(f"   - First mapping:")
            print(json.dumps(data[0], indent=4)[:500])
    else:
        print(f"   ✗ Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n3. Testing GET /curriculum/")
try:
    response = requests.get(f"{BASE_URL}/curriculum/")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Status: {response.status_code}")
        print(f"   ✓ Number of curriculums: {len(data)}")
        if len(data) > 0:
            print(f"   - Curriculums: {data}")
    else:
        print(f"   ✗ Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   ✗ Error: {e}")
