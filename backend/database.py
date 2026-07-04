import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# 1. Load environment variables from the .env file
load_dotenv()

# 2. Retrieve the database URL, defaulting to a local SQLite file for development
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./synapse.db"

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "", 1)
    if db_path.startswith("./") or not db_path.startswith("/"):
        absolute_db_path = str((Path.cwd() / db_path).resolve())
        os.makedirs(Path(absolute_db_path).parent, exist_ok=True)
        SQLALCHEMY_DATABASE_URL = f"sqlite:///{absolute_db_path}"

# 3. Initialize the database engine
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