import requests
import json

BASE_URL = "http://localhost:5000/api/v1"

def test_endpoint(method, path, data=None):
    url = f"{BASE_URL}{path}"
    print(f"Testing {method} {url}...")
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        elif method == "PUT":
            response = requests.put(url, json=data)
        elif method == "DELETE":
            response = requests.delete(url)
        
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response (text): {response.text}")
        return response
    except Exception as e:
        print(f"Error: {e}")
        return None

# Test public login (fail)
test_endpoint("POST", "/auth/login", {"email": "test@example.com", "password": "password"})

# Test register
test_endpoint("POST", "/auth/register", {
    "email": "testuser@example.com",
    "phone_number": "08012345678",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "app_id": "vtfree"
})

# Test login again with the new user
login_res = test_endpoint("POST", "/auth/login", {"email": "testuser@example.com", "password": "password123"})
if login_res and login_res.status_code == 200:
    token = login_res.json().get("data", {}).get("token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test protected routes
    print("\nTesting protected routes...")
    requests_session = requests.Session()
    requests_session.headers.update(headers)
    
    # Profile
    res = requests_session.get(f"{BASE_URL}/users/profile")
    print(f"GET /users/profile: {res.status_code}")
    
    # Wallet
    res = requests_session.get(f"{BASE_URL}/wallet/")
    print(f"GET /wallet/: {res.status_code}")
    
    # Transactions
    res = requests_session.get(f"{BASE_URL}/transactions/")
    print(f"GET /transactions/: {res.status_code}")
    
    # Networks
    res = requests_session.get(f"{BASE_URL}/billpayment/networks")
    print(f"GET /billpayment/networks: {res.status_code}")
