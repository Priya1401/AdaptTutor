from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models


def infer_student_state(db: Session, session_id: int) -> str:
    """
    Analyzes the behavioral logs for a session to infer the cognitive-emotional state.
    Returns one of: 'Frustrated', 'Confused', 'Confident', 'Stuck but calm', 'Progressing'
    """
    fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)
    logs = db.query(models.BehavioralLog).filter(
        models.BehavioralLog.session_id == session_id,
        models.BehavioralLog.timestamp >= fifteen_mins_ago
    ).order_by(models.BehavioralLog.timestamp.desc()).all()

    if not logs:
        return 'Confident'

    # count event types
    submit_logs = [l for l in logs if l.event_type == 'submit_click']
    run_logs = [l for l in logs if l.event_type == 'run_click']
    pause_logs = [l for l in logs if l.event_type == 'keystroke_pause']
    delete_logs = [l for l in logs if l.event_type == 'delete']
    help_clicks = [l for l in logs if l.event_type == 'help_click']
    result_logs = [l for l in logs if l.event_type == 'submission_result']

    activity_count = len(submit_logs) + len(run_logs)

    # check for repeated identical errors from submission results
    error_statuses = []
    for l in result_logs:
        data = l.event_data or {}
        status = data.get('status', '')
        error_type = data.get('error_type', '')
        if status in ('wrong_answer', 'runtime_error', 'compilation_error'):
            error_statuses.append(error_type or status)

    repeated_errors = len(error_statuses) > 2 and len(set(error_statuses)) == 1

    # check average pause duration
    total_pause_ms = 0
    for l in pause_logs:
        data = l.event_data or {}
        total_pause_ms += data.get('duration_ms', 30000)
    avg_pause_ms = total_pause_ms / len(pause_logs) if pause_logs else 0

    # check total chars deleted
    total_deleted = 0
    for l in delete_logs:
        data = l.event_data or {}
        total_deleted += data.get('length', 0)

    # 1. Frustrated: many retries + repeated identical errors OR many retries + heavy deletions
    if activity_count > 5 and (repeated_errors or len(delete_logs) >= 2):
        return 'Frustrated'

    if activity_count > 3 and repeated_errors and len(help_clicks) >= 1:
        return 'Frustrated'

    # 2. Confused: repeated runs without meaningful code changes (same error recurring, no big deletions)
    if activity_count > 4 and repeated_errors and len(delete_logs) == 0:
        return 'Confused'

    if activity_count > 3 and len(delete_logs) == 0 and len(error_statuses) > 2:
        return 'Confused'

    # 3. Stuck but calm: long pauses, minimal frantic activity, maybe a help click
    if len(pause_logs) >= 2 and activity_count <= 2:
        return 'Stuck but calm'

    if len(pause_logs) >= 1 and activity_count <= 2 and len(delete_logs) == 0:
        return 'Stuck but calm'

    if len(help_clicks) >= 1 and activity_count <= 3 and len(delete_logs) == 0:
        return 'Stuck but calm'

    # 4. Progressing: moderate activity, some errors but improving (not all the same error)
    if 2 <= activity_count <= 5 and not repeated_errors:
        return 'Progressing'

    # 5. Confident: low activity, no errors, no pauses, no deletions
    if activity_count <= 1 and len(pause_logs) == 0 and len(delete_logs) == 0:
        return 'Confident'

    # fallback
    if len(help_clicks) >= 1:
        return 'Stuck but calm'

    return 'Progressing'
