import requests
import json

url = "http://127.0.0.1:8001/api/auth/login"
data = {"Lms_email": "test@oges.co", "password": "admin"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
