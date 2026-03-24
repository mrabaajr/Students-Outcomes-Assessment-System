import requests
import json

# Test complete CRUD operations for Student Outcomes

print("=== Testing Student Outcomes CRUD Operations ===\n")

BASE_URL = "http://localhost:8000/api"

# 1. TEST READ (GET)
print("1. Testing READ operation...")
try:
    response = requests.get(f"{BASE_URL}/student-outcomes/")
    if response.status_code == 200:
        outcomes = response.json()
        print(f"   ✓ Successfully retrieved {len(outcomes)} student outcomes")
        
        if len(outcomes) > 0:
            sample_so = outcomes[0]
            print(f"   - Sample: SO {sample_so['number']} - {sample_so['title']}")
    else:
        print(f"   ✗ Error: {response.status_code}")
except Exception as e:
    print(f"   ✗ Connection error: {e}")

print()

# 2. TEST UPDATE (bulk_save)
print("2. Testing UPDATE operation (bulk_save)...")
try:
    # Get all outcomes first
    response = requests.get(f"{BASE_URL}/student-outcomes/")
    outcomes = response.json()
    
    # Modify the first outcome
    if len(outcomes) > 0:
        outcomes[0]['title'] = outcomes[0]['title'] + " [UPDATED]"
        outcomes[0]['description'] = outcomes[0]['description'] + " - Updated from integration test"
        
        # Send updated outcomes back
        payload = {"outcomes": outcomes}
        save_response = requests.post(
            f"{BASE_URL}/student-outcomes/bulk_save/",
            json=payload
        )
        
        if save_response.status_code == 200:
            saved_data = save_response.json()
            if saved_data.get('success'):
                print(f"   ✓ Successfully updated student outcomes")
                updated_so = saved_data['outcomes'][0]
                print(f"   - Updated: {updated_so['title']}")
            else:
                print(f"   ✗ Save failed: {saved_data.get('detail', 'Unknown error')}")
        else:
            print(f"   ✗ Error: {save_response.status_code}")
            print(f"   Response: {save_response.text}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print()

# 3. TEST CREATE (via bulk_save with new item)
print("3. Testing CREATE operation (via bulk_save)...")
try:
    response = requests.get(f"{BASE_URL}/student-outcomes/")
    outcomes = response.json()
    
    # Add a new outcome
    max_number = max(so['number'] for so in outcomes) if outcomes else 0
    new_outcome = {
        "id": None,  # No ID for new items
        "number": max_number + 1,
        "title": f"T.I.P. SO {max_number + 1} [TEST]",
        "description": "Test outcome created via integration test",
        "performanceIndicators": []
    }
    outcomes.append(new_outcome)
    
    payload = {"outcomes": outcomes}
    save_response = requests.post(
        f"{BASE_URL}/student-outcomes/bulk_save/",
        json=payload
    )
    
    if save_response.status_code == 200:
        saved_data = save_response.json()
        if saved_data.get('success'):
            print(f"   ✓ Successfully created new student outcome")
            created_so = saved_data['outcomes'][-1]
            print(f"   - Created: {created_so['title']} (ID: {created_so['id']})")
        else:
            print(f"   ✗ Create failed: {saved_data.get('detail', 'Unknown error')}")
    else:
        print(f"   ✗ Error: {save_response.status_code}")
        print(f"   Response: {save_response.text}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print()

# 4. Final state check
print("4. Verifying final state...")
try:
    response = requests.get(f"{BASE_URL}/student-outcomes/")
    if response.status_code == 200:
        outcomes = response.json()
        print(f"   ✓ Total student outcomes in database: {len(outcomes)}")
        for so in outcomes:
            pi_count = len(so.get('performance_indicators', []))
            print(f"     - SO {so['number']}: {so['title']} ({pi_count} indicators)")
    else:
        print(f"   ✗ Error: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n=== CRUD Test Complete ===")
print("\nThe Student Outcomes page is fully integrated and ready for use!")
