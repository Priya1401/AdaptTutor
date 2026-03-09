from database import SessionLocal
from sqlalchemy import text
db = SessionLocal()
try:
    db.execute(text("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));"))
    db.execute(text("SELECT setval('sessions_id_seq', (SELECT MAX(id) FROM sessions));"))
    db.commit()
    print("Fixed sequences")
except Exception as e:
    print(e)
finally:
    db.close()
