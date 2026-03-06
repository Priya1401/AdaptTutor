from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sessions = relationship("Session", back_populates="user")

class Problem(Base):
    __tablename__ = "problems"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    initial_code = Column(Text)
    expected_output = Column(Text)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    problem_id = Column(Integer, ForeignKey("problems.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    condition = Column(String) # 'static' or 'adaptive'
    
    user = relationship("User", back_populates="sessions")
    problem = relationship("Problem")
    logs = relationship("BehavioralLog", back_populates="session")
    states = relationship("InferredState", back_populates="session")

class BehavioralLog(Base):
    __tablename__ = "behavioral_logs"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    event_type = Column(String) # 'keystroke_pause', 'run', 'submit', 'delete', 'help_click', 'submission_result'
    event_data = Column(JSON) # e.g. {"pause_duration": 31000}, or {"error_type": "SyntaxError"}
    
    session = relationship("Session", back_populates="logs")

class InferredState(Base):
    __tablename__ = "inferred_states"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    state = Column(String) # 'Frustrated', 'Confused', 'Confident', 'Stuck but calm', 'Progressing'
    tutor_response = Column(Text, nullable=True)
    
    session = relationship("Session", back_populates="states")
