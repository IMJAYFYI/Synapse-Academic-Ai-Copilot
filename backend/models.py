from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from database import Base

# --- 1. THE USER TABLE ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String, nullable=True) # Nullable for OAuth users
    
    # OAuth and Auth Method Tracking
    auth_provider = Column(String, default="email") # "email" or "google"
    provider_id = Column(String, nullable=True, index=True) # Google subject ID
    
    # User Preferences
    last_active_topic = Column(String, default="General Study")
    
    # Onboarding Data
    study_time = Column(String, nullable=True)
    academic_level = Column(String, nullable=True)
    learning_style = Column(String, nullable=True)
    main_goal = Column(String, nullable=True)
    theme = Column(String, default="dark")
    reminder_time = Column(String, default="18:00")
    
    # Relationships to link the user to their specific data
    chats = relationship("ChatMessage", back_populates="owner")
    study_records = relationship("StudyRecord", back_populates="owner")
    notes = relationship("StudyNote", back_populates="owner")
    quiz_results = relationship("QuizResult", back_populates="owner")
    syllabi = relationship("Syllabus", back_populates="owner")
    badges = relationship("Badge", back_populates="owner")

# --- 2. THE CHAT HISTORY TABLE ---
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # Links to specific user
    topic_title = Column(String, index=True)
    sender = Column(String)
    text = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="chats")

# --- 3. THE STUDY RECORD TABLE (For Activity Heatmap) ---
class StudyRecord(Base):
    __tablename__ = "study_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # Links to specific user
    topic_title = Column(String, index=True)
    duration_minutes = Column(Integer)
    completion_date = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="study_records")

class Syllabus(Base):
    __tablename__ = "syllabi"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, index=True)
    raw_text = Column(Text)
    extracted_data_json = Column(Text, nullable=True)
    units_data_json = Column(Text, nullable=True)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    owner = relationship("User", back_populates="syllabi")

# --- 5. THE STUDY NOTES TABLE ---
class StudyNote(Base):
    __tablename__ = "study_notes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String, index=True)
    content_json = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    owner = relationship("User", back_populates="notes")

# --- 6. THE QUIZ RESULTS TABLE ---
class QuizResult(Base):
    __tablename__ = "quiz_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String, index=True)
    score = Column(Integer)
    total = Column(Integer)
    quiz_json = Column(Text)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    owner = relationship("User", back_populates="quiz_results")

# --- 7. THE BADGES TABLE ---
class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_name = Column(String, index=True)
    description = Column(String)
    icon = Column(String)  # We can store an emoji or lucide icon name
    unlocked_at = Column(DateTime, default=datetime.datetime.utcnow)
    owner = relationship("User", back_populates="badges")
