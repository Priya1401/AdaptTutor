from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AdaptTutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
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

class ChatRequest(BaseModel):
    session_id: int
    message: str
    code: str
    error: str = ""

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    from database import SessionLocal
    from tutor import generate_tutor_response_async
    from inference import infer_student_state
    import models
    db = SessionLocal()
    try:
        response_text = await generate_tutor_response_async(db, req.session_id, req.message, req.code, req.error)
        current_state = infer_student_state(db, req.session_id)
        
        # Log the latest state & tutor response
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

@app.websocket("/ws/telemetry/{session_id}")
async def telemetry_endpoint(websocket: WebSocket, session_id: int):
    await websocket.accept()
    # Ideally use Depends(get_db) but WebSockets are finicky. We'll spawn a direct session.
    from database import SessionLocal
    db = SessionLocal()
    try:
        while True:
            data = await websocket.receive_json()
            
            # Simple session auto-create for prototyping if it doesn't exist
            # Real app would create Session records elsewhere during login/start.
            db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
            if not db_session:
                # Just mock a user/problem/session for telemetry to succeed
                mock_user = db.query(models.User).filter(models.User.id == 1).first()
                if not mock_user:
                    mock_user = models.User(id=1, username="test_student")
                    db.add(mock_user)
                    db.commit()
                
                db_session = models.Session(
                    id=session_id, 
                    user_id=mock_user.id,
                    condition='adaptive'
                )
                db.add(db_session)
                db.commit()

            # Insert raw behavioral log
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
