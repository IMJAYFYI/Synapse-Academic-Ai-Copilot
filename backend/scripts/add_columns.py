import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN theme VARCHAR DEFAULT 'dark'"))
        print("Added theme column")
    except Exception as e:
        print(f"Theme column might already exist: {e}")
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN reminder_time VARCHAR DEFAULT '18:00'"))
        print("Added reminder_time column")
    except Exception as e:
        print(f"Reminder_time column might already exist: {e}")
    conn.commit()
print("Done")
