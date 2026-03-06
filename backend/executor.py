import httpx
import os
import base64

JUDGE0_URL = os.environ.get("JUDGE0_URL", "https://judge0-ce.p.rapidapi.com")
JUDGE0_KEY = os.environ.get("JUDGE0_KEY", "")

async def execute_code_judge0(source_code: str, language_id: int = 71): # 71 is Python 3
    """
    Submits code to Judge0 for execution and waits for the result.
    If no JUDGE0_KEY is set, this provides a fallback mock execution 
    for the prototype.
    """
    if not JUDGE0_KEY:
        # Fallback Mock for prototype if RapidAPI key isn't provided
        if "SyntaxError" in source_code or "import os" in source_code:
            return {"compile_output": "SyntaxError: invalid syntax", "stdout": None, "stderr": None, "status": {"id": 6, "description": "Compilation Error"}}
        if "IndexError" in source_code:
            return {"stderr": "IndexError: list index out of range\n  File \"main.py\", line 2, in twoSum", "stdout": None, "status": {"id": 11, "description": "Runtime Error (NZEC)"}}
            
        return {"stdout": "Code executed successfully!\n", "stderr": None, "compile_output": None, "status": {"id": 3, "description": "Accepted"}}

    headers = {
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        "x-rapidapi-key": JUDGE0_KEY,
        "content-type": "application/json"
    }
    
    encoded_source = base64.b64encode(source_code.encode("utf-8")).decode("utf-8")
    
    payload = {
        "language_id": language_id,
        "source_code": encoded_source,
        "base64_encoded": True
    }
    
    async with httpx.AsyncClient() as client:
        # 1. Submit Code
        response = await client.post(f"{JUDGE0_URL}/submissions?base64_encoded=true&wait=true", json=payload, headers=headers)
        if response.status_code != 201 and response.status_code != 200:
            return {"error": "Judge0 submission failed"}
            
        result = response.json()
        
        # Decode base64 outputs back to strings
        for field in ["stdout", "stderr", "compile_output"]:
            if result.get(field):
                result[field] = base64.b64decode(result[field]).decode("utf-8")
                
        return result
