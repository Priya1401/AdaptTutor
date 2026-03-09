import os
from google import genai
import time

print("Init genai...")
client = genai.Client()
print("Calling generate_content()...")
start = time.time()
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Respond with a short hello.'
)
print(f"Response ({time.time() - start:.2f}s): {response.text}")
