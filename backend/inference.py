from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models

def infer_student_state(db: Session, session_id: int) -> str:
    """
    Analyzes the behavioral logs for a session to infer the cognitive-emotional state.
    Returns one of: 'Frustrated', 'Confused', 'Confident', 'Stuck but calm', 'Progressing'
    """
    # Fetch recent logs (e.g., last 15 minutes)
    fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)
    logs = db.query(models.BehavioralLog).filter(
        models.BehavioralLog.session_id == session_id,
        models.BehavioralLog.timestamp >= fifteen_mins_ago
    ).order_by(models.BehavioralLog.timestamp.desc()).all()
    
    if not logs:
        return 'Confident' # Default/Baseline
        
    # Heuristics extraction
    submit_logs = [log for log in logs if log.event_type == 'submit_click']
    run_logs = [log for log in logs if log.event_type == 'run_click']
    pause_logs = [log for log in logs if log.event_type == 'keystroke_pause']
    delete_logs = [log for log in logs if log.event_type == 'delete']
    help_clicks = [log for log in logs if log.event_type == 'help_click']
    
    # 1. Frustrated: Many retries, frantic deletions, identical errors (mocked via high run count + deletes)
    # E.g. >5 runs/submits in short window + multiple massive deletions
    activity_count = len(submit_logs) + len(run_logs)
    if activity_count > 5 and len(delete_logs) >= 2:
        return 'Frustrated'
        
    # 2. Stuck but calm: Long pauses, minimal frantic activity
    if len(pause_logs) >= 1 and activity_count <= 2 and len(delete_logs) == 0:
        return 'Stuck but calm'
        
    # 3. Confused: Repeated errors without meaningful changes, high run count without deletions
    if activity_count > 4 and len(delete_logs) == 0:
        # Assuming they keep running the exact same failing code repeatedly
        return 'Confused'
        
    # 4. Progressing: Incremental submits/runs, occasional pauses, few deletions
    if 2 <= activity_count <= 4 and len(pause_logs) < 2:
        return 'Progressing'
        
    # 5. Confident: Steady progress, minimal errors/runs
    if activity_count <= 1 and len(pause_logs) == 0 and len(delete_logs) == 0:
        return 'Confident'
        
    # Fallback based on help clicks
    if help_clicks:
        return 'Stuck but calm'
        
    return 'Progressing'
