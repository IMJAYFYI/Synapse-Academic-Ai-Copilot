import requests

res_signup = requests.post("http://localhost:8000/api/signup", json={"name": "Karan", "email": "test@karan.com", "password": "password"})
print("Signup Status:", res_signup.status_code)
print("Signup Text:", res_signup.text)

res_login = requests.post("http://localhost:8000/api/login", json={"email": "test@karan.com", "password": "password"})
print("Login Status:", res_login.status_code)
print("Login Text:", res_login.text)

if "token" in res_login.json():
    token = res_login.json()["token"]
    user_id = res_login.json()["user_id"]
    
    # Test protected route without token
    res_fail = requests.get(f"http://localhost:8000/api/dashboard-stats/{user_id}")
    print("Protected without token:", res_fail.json())
    
    # Test protected route with token
    res_success = requests.get(f"http://localhost:8000/api/dashboard-stats/{user_id}", headers={"Authorization": f"Bearer {token}"})
    print("Protected with token:", res_success.json())
