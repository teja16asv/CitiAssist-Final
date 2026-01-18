import requests
import json

try:
    response = requests.post(
        "http://localhost:5000/api/chat", 
        json={"message": "What is the capital of France?"} # Intentionally out of scope to test system instruction
    )
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(e)
