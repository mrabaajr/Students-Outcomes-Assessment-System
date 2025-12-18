#!/usr/bin/env python
"""
Quick test script for creating user accounts with temporary passwords.
Usage: python manage.py shell < test_account_creation.py
Or run directly in Django shell.
"""

import requests
import json

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def create_account(email, first_name, last_name, role, department=""):
    """Create a user account with temporary password"""
    
    payload = {
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "role": role,
        "department": department
    }
    
    try:
        response = requests.post(
            f"{API_URL}/users/create_account/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"\n✓ Account created successfully!")
            print(f"  Email: {data['user']['email']}")
            print(f"  Role: {data['user']['role']}")
            print(f"  Email Sent: {data['email_sent']}")
            print(f"  Message: {data['message']}")
            return data
        else:
            print(f"\n✗ Error creating account:")
            print(f"  Status: {response.status_code}")
            print(f"  Response: {response.json()}")
            return None
    except Exception as e:
        print(f"\n✗ Connection error: {str(e)}")
        print(f"  Make sure Django server is running on {BASE_URL}")
        return None

def login_test(email, password):
    """Test login with temporary password"""
    
    try:
        response = requests.post(
            f"{API_URL}/token/",
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✓ Login successful!")
            print(f"  Access Token: {data['access'][:50]}...")
            print(f"  Refresh Token: {data['refresh'][:50]}...")
            return data
        else:
            print(f"\n✗ Login failed:")
            print(f"  Status: {response.status_code}")
            print(f"  Response: {response.json()}")
            return None
    except Exception as e:
        print(f"\n✗ Connection error: {str(e)}")
        return None

# Test account creation
print("=" * 60)
print("TESTING EMAIL SMTP & ACCOUNT CREATION")
print("=" * 60)

print("\n1. Creating Program Chair Account...")
program_chair = create_account(
    email="programchair@example.com",
    first_name="John",
    last_name="Smith",
    role="admin",
    department="Engineering"
)

print("\n2. Creating Staff Account...")
staff = create_account(
    email="staff@example.com",
    first_name="Jane",
    last_name="Doe",
    role="staff",
    department="Education"
)

# Optional: Test login (if you know the temporary password)
print("\n" + "=" * 60)
print("Note: Check your email for the temporary passwords")
print("Then test login with: login_test('email@example.com', 'password')")
print("=" * 60)
