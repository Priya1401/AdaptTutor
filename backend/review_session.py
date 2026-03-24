"""
Quick review of the most recent (or a specific) session.
Usage:
    python review_session.py          # reviews the latest session
    python review_session.py 3        # reviews session with id=3
"""
import sys
import json
from database import SessionLocal
from models import User, Session, SurveyResponse, InferredState, BehavioralLog, Problem

def review(session_id=None):
    db = SessionLocal()
    try:
        if session_id:
            session = db.query(Session).filter(Session.id == session_id).first()
        else:
            session = db.query(Session).order_by(Session.id.desc()).first()

        if not session:
            print("No session found.")
            return

        user = db.query(User).filter(User.id == session.user_id).first()
        username = user.username if user else f"user_id={session.user_id}"

        print(f"\n{'='*60}")
        print(f"SESSION {session.id}  |  User: {username}  |  Condition: {session.condition}")
        print(f"Started: {session.start_time}  |  Ended: {session.end_time}")
        print(f"{'='*60}")

        # --- Surveys ---
        surveys = db.query(SurveyResponse).filter(SurveyResponse.session_id == session.id).all()

        pre = next((s for s in surveys if s.survey_type == 'pre'), None)
        if pre:
            r = pre.responses
            print(f"\nPRE-SURVEY")
            print(f"  Experience:       {r.get('experience')} yrs")
            print(f"  Python skill:     {r.get('python_skill')} / 5")
            print(f"  Year in school:   {r.get('year_in_school')}")
            print(f"  Primary language: {r.get('primary_language')}")
            print(f"  AI tool use:      {r.get('ai_tool_use')}")
            order = r.get('problem_order')
            if order:
                print(f"  Problem order:    {order}")

        # Per-problem surveys
        print(f"\nPER-PROBLEM RESULTS")
        print(f"  {'Problem':<25} {'Condition':<12} {'Frustration':<13} {'Helpfulness':<13} {'Self-reported state'}")
        print(f"  {'-'*85}")

        problem_surveys = [s for s in surveys if s.survey_type.startswith('post_problem_')]
        problem_surveys.sort(key=lambda s: s.id)
        for s in problem_surveys:
            r = s.responses
            prob_title = r.get('problem_title', s.survey_type)
            condition  = r.get('condition', '?')
            frustration = r.get('frustration', '?')
            helpfulness = r.get('helpfulness', '?')
            state       = r.get('self_reported_state', '?')
            print(f"  {prob_title:<25} {condition:<12} {frustration:<13} {helpfulness:<13} {state}")

        post = next((s for s in surveys if s.survey_type == 'post'), None)
        if post:
            r = post.responses
            print(f"\nPOST-SURVEY")
            print(f"  Overall usefulness:    {r.get('usefulness')} / 5")
            print(f"  Overall frustration:   {r.get('frustration')} / 5")
            print(f"  Tutor preference:      {r.get('preference')}")
            print(f"  Noticed difference:    {r.get('noticed_difference')}")
            if r.get('feedback'):
                print(f"  Feedback:              {r.get('feedback')}")

        # --- Inferred states ---
        states = db.query(InferredState).filter(InferredState.session_id == session.id)\
                    .order_by(InferredState.timestamp).all()
        if states:
            print(f"\nINFERRED STATES ({len(states)} total)")
            for s in states:
                print(f"  [{s.timestamp.strftime('%H:%M:%S')}] {s.state}")
        else:
            print(f"\nINFERRED STATES  none logged (no tutor interactions?)")

        # --- Telemetry summary ---
        logs = db.query(BehavioralLog).filter(BehavioralLog.session_id == session.id).all()
        if logs:
            from collections import Counter
            counts = Counter(l.event_type for l in logs)
            print(f"\nTELEMETRY SUMMARY ({len(logs)} events)")
            for event, count in sorted(counts.items()):
                print(f"  {event:<25} {count}")

        print(f"\n{'='*60}\n")

    finally:
        db.close()

if __name__ == "__main__":
    sid = int(sys.argv[1]) if len(sys.argv) > 1 else None
    review(sid)
