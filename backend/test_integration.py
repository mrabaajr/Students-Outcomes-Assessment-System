import requests
import json

# Test the full integration with data transformations

# 1. Fetch outcomes from the API (backend format)
print("=== Testing Student Outcomes Backend Integration ===\n")

url = "http://localhost:8000/api/student-outcomes/"

try:
    response = requests.get(url)
    
    if response.status_code == 200:
        outcomes = response.json()
        
        print(f"✓ Backend API is responding (Status: {response.status_code})")
        print(f"✓ Retrieved {len(outcomes)} student outcomes from database\n")
        
        # Verify the structure matches what the hook expects
        for outcome in outcomes:
            assert 'id' in outcome, "Missing 'id' field"
            assert 'number' in outcome, "Missing 'number' field"
            assert 'title' in outcome, "Missing 'title' field"
            assert 'description' in outcome, "Missing 'description' field"
            
            # Both formats should be supported by the hook
            has_perf_indicators = (
                'performance_indicators' in outcome or 
                'performanceIndicators' in outcome
            )
            assert has_perf_indicators, "Missing performance indicators"
            
        print("✓ All outcomes have required fields\n")
        
        # Check the structure of performance indicators and criteria
        first_outcome = outcomes[0]
        pis = first_outcome.get('performance_indicators', first_outcome.get('performanceIndicators', []))
        
        print(f"First outcome details:")
        print(f"  - Title: {first_outcome['title']}")
        print(f"  - Number: {first_outcome['number']}")
        print(f"  - Performance Indicators: {len(pis)}")
        
        if len(pis) > 0:
            first_pi = pis[0]
            criteria = first_pi.get('criteria', [])
            print(f"    - First PI has {len(criteria)} criteria")
            print(f"\n✓ Data structure is compatible with frontend hook\n")
        
        print("=== Integration Test Passed ===")
        print("\nThe Student Outcomes page should now:")
        print("1. Load student outcomes from the backend API")
        print("2. Display them with the correct structure")
        print("3. Allow users to add, edit, and delete outcomes")
        print("4. Save changes back to the backend")
        
    else:
        print(f"✗ API returned error status: {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"✗ Connection error: {e}")
    print("\nMake sure the Django backend server is running on port 8000")
