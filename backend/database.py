import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# 1. Load environment variables from the .env file
load_dotenv()

# 2. Retrieve the PostgreSQL URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 3. Initialize the database engine
# Notice we removed connect_args={"check_same_thread": False} as Postgres handles concurrent threading natively.
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 4. Configure the Session Local instance
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 5. Initialize the Declarative Base for models
Base = declarative_base()

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()