import requests
import json

# Test if backend API is responding
url = "http://localhost:8000/api/student-outcomes/"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nSuccessfully retrieved student outcomes!")
        print(f"Response type: {type(data)}")
        
        if isinstance(data, list):
            print(f"Number of outcomes: {len(data)}")
            if len(data) > 0:
                print(f"\nFirst outcome:")
                print(json.dumps(data[0], indent=2))
        elif isinstance(data, dict):
            if 'results' in data:
                print(f"Number of outcomes: {len(data['results'])}")
                if len(data['results']) > 0:
                    print(f"\nFirst outcome:")
                    print(json.dumps(data['results'][0], indent=2))
            else:
                print(json.dumps(data, indent=2))
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Connection error: {e}")
    print("Backend may not be running on http://localhost:8000")
