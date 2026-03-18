import httpx
import os
import base64
import subprocess
import tempfile

JUDGE0_URL = os.environ.get("JUDGE0_URL", "https://judge0-ce.p.rapidapi.com")
JUDGE0_KEY = os.environ.get("JUDGE0_KEY", "")


async def execute_code_judge0(source_code: str, language_id: int = 71):
    """
    Submits code to Judge0 for execution and waits for the result.
    If no JUDGE0_KEY is set, falls back to local Python execution.
    """
    if not JUDGE0_KEY:
        return run_local_python(source_code)

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
        response = await client.post(f"{JUDGE0_URL}/submissions?base64_encoded=true&wait=true", json=payload, headers=headers)
        if response.status_code != 201 and response.status_code != 200:
            return {"error": "Judge0 submission failed"}

        result = response.json()

        for field in ["stdout", "stderr", "compile_output"]:
            if result.get(field):
                result[field] = base64.b64decode(result[field]).decode("utf-8")

        return result


def run_local_python(source_code: str) -> dict:
    """
    Executes Python code locally in a subprocess with a 10 second timeout.
    Only used as fallback when no Judge0 key is provided.
    """
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(source_code)
            tmp_path = f.name

        result = subprocess.run(
            ['python3', tmp_path],
            capture_output=True,
            text=True,
            timeout=10
        )

        os.unlink(tmp_path)

        if result.returncode != 0:
            return {
                "stdout": None,
                "stderr": result.stderr,
                "compile_output": None,
                "status": {"id": 11, "description": "Runtime Error (NZEC)"}
            }

        return {
            "stdout": result.stdout,
            "stderr": None,
            "compile_output": None,
            "status": {"id": 3, "description": "Accepted"}
        }

    except subprocess.TimeoutExpired:
        os.unlink(tmp_path)
        return {
            "stdout": None,
            "stderr": "Time Limit Exceeded (10s)",
            "compile_output": None,
            "status": {"id": 5, "description": "Time Limit Exceeded"}
        }
    except Exception as e:
        return {
            "stdout": None,
            "stderr": str(e),
            "compile_output": None,
            "status": {"id": 11, "description": "Runtime Error (NZEC)"}
        }
