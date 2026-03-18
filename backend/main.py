from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from datetime import datetime
import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AdaptTutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExecuteRequest(BaseModel):
    source_code: str
    language_id: int = 71

@app.post("/api/execute")
async def execute_code(req: ExecuteRequest):
    from executor import execute_code_judge0
    result = await execute_code_judge0(req.source_code, req.language_id)
    return result

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    session_id: int
    message: str
    code: str
    error: str = ""
    chat_history: list[ChatMessage] = []

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    from database import SessionLocal
    from tutor import generate_tutor_response_async
    from inference import infer_student_state
    import models
    db = SessionLocal()
    try:
        history = [{"role": m.role, "content": m.content} for m in req.chat_history]
        response_text = await generate_tutor_response_async(db, req.session_id, req.message, req.code, req.error, chat_history=history)
        current_state = infer_student_state(db, req.session_id)

        new_state_log = models.InferredState(
            session_id=req.session_id,
            state=current_state,
            tutor_response=response_text
        )
        db.add(new_state_log)
        db.commit()

        return {"response": response_text, "inferred_state": current_state}
    finally:
        db.close()

@app.get("/api/problems")
def get_problems():
    from database import SessionLocal
    import models
    db = SessionLocal()
    try:
        problems = db.query(models.Problem).all()
        return [{"id": p.id, "title": p.title, "description": p.description, "initial_code": p.initial_code} for p in problems]
    finally:
        db.close()

class SurveySubmitRequest(BaseModel):
    session_id: int
    survey_type: str
    responses: dict

@app.post("/api/survey")
async def submit_survey(req: SurveySubmitRequest):
    from database import SessionLocal
    import models
    db = SessionLocal()
    try:
        new_survey = models.SurveyResponse(
            session_id=req.session_id,
            survey_type=req.survey_type,
            responses=req.responses
        )
        db.add(new_survey)
        db.commit()
        return {"status": "success", "message": f"{req.survey_type} survey saved successfully."}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "AdaptTutor Backend Active"}

class StartSessionRequest(BaseModel):
    condition: str = ""

@app.post("/api/sessions/start")
def start_session(req: StartSessionRequest = StartSessionRequest()):
    import uuid
    from database import SessionLocal
    import models
    db = SessionLocal()
    try:
        # Use forced condition from URL param if provided, otherwise auto-balance
        # Map neutral labels so participants can't tell from the URL
        condition_map = {'a': 'static', 'b': 'adaptive', 'static': 'static', 'adaptive': 'adaptive'}
        if req.condition in condition_map:
            condition = condition_map[req.condition]
        else:
            adaptive_count = db.query(models.Session).filter(models.Session.condition == 'adaptive').count()
            static_count = db.query(models.Session).filter(models.Session.condition == 'static').count()
            condition = 'adaptive' if static_count >= adaptive_count else 'static'

        new_user = models.User(username=f"user_{uuid.uuid4().hex[:8]}")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        new_session = models.Session(user_id=new_user.id, condition=condition)
        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        return {"session_id": new_session.id, "condition": condition}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.post("/api/sessions/{session_id}/end")
def end_session(session_id: int):
    from database import SessionLocal
    import models
    db = SessionLocal()
    try:
        session = db.query(models.Session).filter(models.Session.id == session_id).first()
        if session:
            session.end_time = datetime.utcnow()
            db.commit()
            return {"status": "success"}
        return {"status": "error", "message": "Session not found"}
    finally:
        db.close()

class ProblemStartRequest(BaseModel):
    session_id: int
    problem_id: int
    condition: str = ""

@app.post("/api/sessions/problem")
def set_session_problem(req: ProblemStartRequest):
    from database import SessionLocal
    import models
    db = SessionLocal()
    try:
        session = db.query(models.Session).filter(models.Session.id == req.session_id).first()
        if session:
            session.problem_id = req.problem_id
            if req.condition in ('adaptive', 'static'):
                session.condition = req.condition
            db.commit()
            return {"status": "success"}
        return {"status": "error", "message": "Session not found"}
    finally:
        db.close()

@app.websocket("/ws/telemetry/{session_id}")
async def telemetry_endpoint(websocket: WebSocket, session_id: int):
    await websocket.accept()
    from database import SessionLocal
    db = SessionLocal()
    try:
        while True:
            data = await websocket.receive_json()

            db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
            if not db_session:
                continue

            log = models.BehavioralLog(
                session_id=session_id,
                event_type=data.get('event_type'),
                event_data=data.get('event_data', {})
            )
            db.add(log)
            db.commit()
            print(f"Stored Log for Session {session_id}: {data}")
    except WebSocketDisconnect:
        print(f"Session {session_id} disconnected")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
