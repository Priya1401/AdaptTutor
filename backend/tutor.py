import os
from google import genai
from google.genai import types
from inference import infer_student_state
from sqlalchemy.orm import Session
import models

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Initialize client if key exists
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

def generate_tutor_response(db: Session, session_id: int, user_message: str, current_code: str, recent_error: str) -> str:
    """
    Generates an adaptive response from Gemini 2.5 Flash based on the user's inferred state.
    """
    if not client:
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

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return "I'm having trouble connecting to my AI brain right now. Can you try asking again?"
