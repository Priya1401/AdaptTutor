import csv
import os
from database import SessionLocal
import models
from datetime import datetime

def export_to_csv():
    db = SessionLocal()
    try:
        # Export Sessions
        print("Exporting sessions...")
        sessions = db.query(models.Session).all()
        with open('export_sessions.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Session ID', 'User ID', 'Condition', 'Start Time', 'End Time'])
            for s in sessions:
                writer.writerow([s.id, s.user_id, s.condition, s.start_time, s.end_time])
                
        # Export Telemetry
        print("Exporting behavioral logs...")
        logs = db.query(models.BehavioralLog).all()
        with open('export_telemetry.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Log ID', 'Session ID', 'Timestamp', 'Event Type', 'Event Data'])
            for log in logs:
                writer.writerow([log.id, log.session_id, log.timestamp, log.event_type, log.event_data])
                
        # Export Inferred States
        print("Exporting inferred states (Tutor Interactions)...")
        states = db.query(models.InferredState).all()
        with open('export_states.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['State ID', 'Session ID', 'Timestamp', 'Inferred State', 'Tutor Response'])
            for state in states:
                writer.writerow([state.id, state.session_id, state.timestamp, state.state, state.tutor_response])
                
        print("Export complete! Files saved to backend/ directory.")
        
    finally:
        db.close()

if __name__ == "__main__":
    export_to_csv()
