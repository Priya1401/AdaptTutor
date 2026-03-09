import os
import httpx
from inference import infer_student_state
from sqlalchemy.orm import Session
import models

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

async def generate_tutor_response_async(db: Session, session_id: int, user_message: str, current_code: str, recent_error: str) -> str:
    """
    Generates an adaptive response from Gemini 2.5 Flash using the REST API.
    """
    if not GEMINI_API_KEY:
        return "[Mock Response] The API key is not set. Please set GEMINI_API_KEY. I infer you are making good progress!"
        
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    
    # 1. Infer State
    if session and session.condition == 'adaptive':
        state = infer_student_state(db, session_id)
    else:
        state = 'Static' # Control group gets no state conditioning
        
    # 2. Construct Prompt Rules based on state
    state_instructions = {
        'Frustrated': "The student appears FRUSTRATED. Use an empathetic, encouraging tone ('You're closer than you think!'). Break the hints down into very small, digestible steps. Do not overwhelm them.",
        'Confused': "The student appears CONFUSED. Explain the underlying concept from the basics. Use a helpful analogy. Provide a step-by-step walkthrough of the logic instead of focusing on the immediate syntax error.",
        'Confident': "The student appears CONFIDENT and is making steady progress. Provide minimal intervention. Use Socratic questioning to deepen their thinking (e.g., 'Can you think of an edge case that might break this?').",
        'Stuck but calm': "The student is STUCK BUT CALM. They are thinking. Provide a single targeted hint pointing them in the right direction without revealing the answer.",
        'Progressing': "The student is PROGRESSING well. Provide positive reinforcement and answer their question directly and concisely without disrupting their flow.",
        'Static': "Provide standard, objective coding assistance. Be helpful and direct in answering the question or explaining the error."
    }
    
    instruction = state_instructions.get(state, state_instructions['Static'])

    prompt = f"""You are AdaptTutor, an AI coding assistant.
Pedagogical Strategy Context: {instruction}

Current Code:
```python
{current_code}
```

Recent Error Output (if any):
```
{recent_error}
```

Student Message: {user_message}

Based on the pedagogical strategy, please provide your response."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            
        if response.status_code == 200:
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            print(f"Gemini API Error: {response.status_code} {response.text}")
            return "I'm having trouble connecting to my AI brain right now. Can you try asking again?"
    except Exception as e:
        print(f"Gemini Exception: {e}")
        return "I'm having trouble connecting to my AI brain right now. Can you try asking again?"

def generate_tutor_response(db: Session, session_id: int, user_message: str, current_code: str, recent_error: str) -> str:
    # Deprecated sync wrapper if used elsewhere
    pass

