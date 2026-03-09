import requests
import os
import time

api_key = os.environ.get("GEMINI_API_KEY", "")
print("Calling generate_content via requests...")
start = time.time()
response = requests.post(
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
    json={"contents": [{"parts": [{"text": "Respond with a short hello."}]}]}
)
print(f"Response ({time.time() - start:.2f}s): {response.json()}")
