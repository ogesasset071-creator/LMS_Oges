import urllib.request
import json

url = "http://127.0.0.1:8001/api/auth/login"
data = {"Lms_email": "test@oges.co", "password": "admin"}
params = json.dumps(data).encode('utf8')
req = urllib.request.Request(url, data=params, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        print(f"Response Body: {response.read().decode('utf8')}")
except urllib.error.HTTPError as e:
    print(f"Status Code: {e.code}")
    print(f"Response Body: {e.read().decode('utf8')}")
except Exception as e:
    print(f"Error: {e}")
