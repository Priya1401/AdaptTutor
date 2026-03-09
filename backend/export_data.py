import os
import csv
import json
from database import SessionLocal
from models import User, Session, Problem, BehavioralLog, InferredState, SurveyResponse

EXPORT_DIR = "data_exports"
if not os.path.exists(EXPORT_DIR):
    os.makedirs(EXPORT_DIR)

def export_sessions(db):
    sessions = db.query(Session).all()
    filepath = os.path.join(EXPORT_DIR, "sessions.csv")
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['session_id', 'user_id', 'condition', 'start_time', 'end_time'])
        for s in sessions:
            writer.writerow([s.id, s.user_id, s.condition, s.start_time, s.end_time])
    print(f"Exported {len(sessions)} sessions to {filepath}")

def export_telemetry(db):
    logs = db.query(BehavioralLog).all()
    filepath = os.path.join(EXPORT_DIR, "telemetry.csv")
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['log_id', 'session_id', 'timestamp', 'event_type', 'event_data'])
        for l in logs:
            writer.writerow([l.id, l.session_id, l.timestamp, l.event_type, json.dumps(l.event_data)])
    print(f"Exported {len(logs)} telemetry logs to {filepath}")

def export_surveys(db):
    surveys = db.query(SurveyResponse).all()
    filepath = os.path.join(EXPORT_DIR, "surveys.csv")
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['survey_id', 'session_id', 'survey_type', 'timestamp', 'responses'])
        for s in surveys:
            writer.writerow([s.id, s.session_id, s.survey_type, s.timestamp, json.dumps(s.responses)])
    print(f"Exported {len(surveys)} survey responses to {filepath}")

def main():
    db = SessionLocal()
    try:
        print("Starting data export...")
        export_sessions(db)
        export_telemetry(db)
        export_surveys(db)
        print("Export complete!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
