import sys
import os

from pydantic import BaseModel as PydanticBaseModel
from ai_agent import analyze_syllabus, extract_subject_details, chat_with_coach, generate_study_notes, generate_quiz
from datetime import datetime, timedelta, date
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import pypdf
import io
import json 
import models
from database import engine, get_db
from typing import List, Dict, Optional # NEW: Added Optional for the hidden prompt
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
import bcrypt

def verify_password(plain_password, hashed_password):
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

class UserCreate(PydanticBaseModel):
    name: str
    email: str
    password: str
    study_time: Optional[str] = None
    academic_level: Optional[str] = None
    learning_style: Optional[str] = None
    main_goal: Optional[str] = None
    reminder_time: Optional[str] = None

class UserLogin(PydanticBaseModel):
    email: str
    password: str

class ChatRequest(PydanticBaseModel):
    message: str
    hidden_prompt: Optional[str] = None # NEW: Accepts the massive syllabus text safely
    history: List[Dict[str, str]]
    active_topic: str
    user_id: int

class StudySessionRequest(PydanticBaseModel):
    topic_title: str
    duration_minutes: int
    user_id: int

class SubjectRequest(PydanticBaseModel):
    syllabus_id: int
    subject_name: str
    topic_index: int

class UpdateActiveTopicRequest(PydanticBaseModel):
    user_id: int
    active_topic: str

class SettingsUpdateRequest(PydanticBaseModel):
    user_id: int
    theme: Optional[str] = None
    reminder_time: Optional[str] = None

class NotesGenerateRequest(PydanticBaseModel):
    user_id: int
    topic: str

class QuizGenerateRequest(PydanticBaseModel):
    user_id: int
    topic: str
    syllabus_id: Optional[int] = None
    target_unit: Optional[str] = None
    difficulty: str = "medium"
    num_questions: int = 5

class QuizSubmitRequest(PydanticBaseModel):
    user_id: int
    topic: str
    score: int
    total: int
    quiz_json: str

app = FastAPI(title="Synapse AI Copilot API")

models.Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-for-prototyping")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7



def create_access_token(data: dict):
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.middleware("http")
async def verify_token_middleware(request: Request, call_next):
    open_paths = ["/api/login", "/api/signup", "/api/auth/google", "/docs", "/openapi.json"]
    if request.url.path in open_paths or request.method == "OPTIONS":
        return await call_next(request)
        
    if request.url.path.startswith("/api/"):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Missing or invalid token"})
        token = auth_header.split(" ")[1]
        try:
            jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except jwt.PyJWTError:
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})
            
    return await call_next(request)

class GoogleLoginRequest(PydanticBaseModel):
    credential: str

@app.get("/")
def read_root():
    return {"status": "success", "message": "FastAPI Backend is running efficiently."}

@app.post("/api/upload-syllabus")
async def upload_syllabus(user_id: int = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported currently.")

    try:
        file_content = await file.read()
        pdf_reader = pypdf.PdfReader(io.BytesIO(file_content))
        
        extracted_text = ""
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
        
        new_syllabus = models.Syllabus(
            user_id=user_id,
            filename=file.filename,
            raw_text=extracted_text
        )
        db.add(new_syllabus)
        db.commit()
        db.refresh(new_syllabus)
        
        print(f"\n[SYSTEM] Sending {len(extracted_text)} characters to Gemini 2.5 Flash...")
        
        ai_result_string = analyze_syllabus(extracted_text)
        
        print("\n--- [RAW AI OUTPUT] ---")
        print(ai_result_string)
        print("-----------------------\n")
        
        ai_data = json.loads(ai_result_string)
        
        new_syllabus.extracted_data_json = json.dumps(ai_data)
        db.commit()
        
        # Add to ChromaDB Vectorstore
        print(f"\n[SYSTEM] Ingesting syllabus into ChromaDB...")
        try:
            from ai_agent import ingest_syllabus_to_vectorstore
            ingest_syllabus_to_vectorstore(extracted_text, new_syllabus.id)
            print(f"[SYSTEM] ChromaDB Ingestion Complete!")
        except Exception as e:
            print(f"[ERROR] ChromaDB Ingestion Failed: {e}")

        return {
            "status": "success", 
            "filename": file.filename,
            "syllabus_id": new_syllabus.id,
            "analysis": ai_data 
        }
        
    except Exception as e:
        print(f"\n--- API EXTRACTION ERROR ---")
        print(str(e))
        print(f"----------------------------\n")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/extract-subject")
async def get_subject_details(request: SubjectRequest, db: Session = Depends(get_db)):
    syllabus = db.query(models.Syllabus).filter(models.Syllabus.id == request.syllabus_id).first()
    
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found in database.")
    
    try:
        ai_result_string = extract_subject_details(syllabus.raw_text, request.subject_name)
        ai_data = json.loads(ai_result_string)
        
        existing_units = json.loads(syllabus.units_data_json) if syllabus.units_data_json else {}
        existing_units[str(request.topic_index)] = ai_data["units"]
        syllabus.units_data_json = json.dumps(existing_units)
        db.commit()
        
        return {"status": "success", "data": ai_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/record-session")
async def record_study_session(request: StudySessionRequest, db: Session = Depends(get_db)):
    try:
        new_record = models.StudyRecord(
            user_id=request.user_id, # FIXED: Changed record.user_id to request.user_id
            topic_title=request.topic_title,
            duration_minutes=request.duration_minutes
        )
        
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        # Gamification: Evaluate Badges
        new_badges = []
        user_badges = [b.badge_name for b in db.query(models.Badge).filter(models.Badge.user_id == request.user_id).all()]
        
        # 1. First Session Badge
        if "First Steps" not in user_badges:
            total_records = db.query(models.StudyRecord).filter(models.StudyRecord.user_id == request.user_id).count()
            if total_records >= 1:
                b = models.Badge(user_id=request.user_id, badge_name="First Steps", description="Completed your very first study session!", icon="🎯")
                db.add(b)
                new_badges.append(b.badge_name)
        
        # 2. Night Owl Badge
        if "Night Owl" not in user_badges:
            current_hour = datetime.now().hour
            if current_hour >= 21 or current_hour <= 3:
                b = models.Badge(user_id=request.user_id, badge_name="Night Owl", description="Studied late into the night.", icon="🦉")
                db.add(b)
                new_badges.append(b.badge_name)
                
        # 3. Marathon Badge
        if "Marathon" not in user_badges and request.duration_minutes >= 60:
            b = models.Badge(user_id=request.user_id, badge_name="Marathon", description="Studied for over 60 minutes in one session.", icon="🏃‍♂️")
            db.add(b)
            new_badges.append(b.badge_name)
            
        if new_badges:
            db.commit()
        
        return {
            "status": "success", 
            "message": f"Successfully logged {request.duration_minutes} minutes for {request.topic_title}.",
            "record_id": new_record.id,
            "new_badges": new_badges
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/badges/{user_id}")
async def get_badges(user_id: int, db: Session = Depends(get_db)):
    try:
        badges = db.query(models.Badge).filter(models.Badge.user_id == user_id).order_by(models.Badge.unlocked_at.desc()).all()
        return [
            {
                "id": b.id,
                "name": b.badge_name,
                "description": b.description,
                "icon": b.icon,
                "unlocked_at": b.unlocked_at.isoformat()
            } for b in badges
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/activity-data/{user_id}")
async def get_activity_data(user_id: int, db: Session = Depends(get_db)):
    try:
        activity = db.query(
            func.date(models.StudyRecord.completion_date).label("study_date"),
            func.sum(models.StudyRecord.duration_minutes).label("total_minutes")
        ).filter(
            models.StudyRecord.user_id == user_id
        ).group_by(
            func.date(models.StudyRecord.completion_date)
        ).all()

        activity_dict = {row.study_date: row.total_minutes for row in activity if row.study_date}
        
        total_all_time = sum(row.total_minutes for row in activity)
        total_days = len(activity)

        return {
            "status": "success", 
            "data": activity_dict,
            "stats": {
                "total_minutes": total_all_time,
                "total_days": total_days
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/history/{user_id}/{topic_title}")
async def get_chat_history(user_id: int, topic_title: str, db: Session = Depends(get_db)):
    try:
        messages = db.query(models.ChatMessage).filter(
            models.ChatMessage.user_id == user_id,
            models.ChatMessage.topic_title == topic_title
        ).order_by(models.ChatMessage.timestamp.asc()).all()
        
        formatted_messages = [{"sender": msg.sender, "text": msg.text} for msg in messages]
        return {"status": "success", "history": formatted_messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import StreamingResponse
from ai_agent import chat_with_coach_stream

@app.post("/api/chat")
async def study_coach_chat(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        # 1. Save ONLY the clean UI message to the Postgres database
        user_msg = models.ChatMessage(
            user_id=request.user_id, 
            topic_title=request.active_topic, 
            sender="user", 
            text=request.message
        )
        db.add(user_msg)
        db.commit()

        # 2. Decide what to send to the AI
        ai_query = request.hidden_prompt if request.hidden_prompt else request.message

        async def event_generator():
            full_response = ""
            # Stream chunks from LangChain
            for chunk in chat_with_coach_stream(ai_query, request.history, request.active_topic):
                full_response += chunk
                # SSE format: data: {...}\n\n
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            # Save AI message to DB after stream finishes
            ai_msg = models.ChatMessage(
                user_id=request.user_id, 
                topic_title=request.active_topic, 
                sender="ai", 
                text=full_response
            )
            db.add(ai_msg)
            db.commit()
            
            # Send done signal
            yield f"data: {json.dumps({'done': True})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- DASHBOARD & NOTES & QUIZ ROUTES ---

@app.get("/api/dashboard-stats/{user_id}")
async def get_dashboard_stats(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get today's study time
        today = date.today()
        today_records = db.query(func.sum(models.StudyRecord.duration_minutes)).filter(
            models.StudyRecord.user_id == user_id,
            func.date(models.StudyRecord.completion_date) == today
        ).scalar() or 0
        
        # Get weekly hours (Mon-Sun of current week)
        # Find the Monday of this week
        today_dt = datetime.now()
        monday = today_dt - timedelta(days=today_dt.weekday())
        monday_date = monday.date()
        
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        weekly_hours = []
        for i in range(7):
            day_date = monday_date + timedelta(days=i)
            day_minutes = db.query(func.sum(models.StudyRecord.duration_minutes)).filter(
                models.StudyRecord.user_id == user_id,
                func.date(models.StudyRecord.completion_date) == day_date
            ).scalar() or 0
            weekly_hours.append({"name": day_names[i], "hours": round(day_minutes / 60, 1)})
        
        # Calculate current streak
        all_dates = db.query(
            func.date(models.StudyRecord.completion_date).label("study_date")
        ).filter(
            models.StudyRecord.user_id == user_id
        ).distinct().order_by(
            func.date(models.StudyRecord.completion_date).desc()
        ).all()
        
        study_dates = sorted(set([row.study_date for row in all_dates if row.study_date]), reverse=True)
        
        current_streak = 0
        check_date = today
        for d in study_dates:
            d_as_date = d if isinstance(d, date) else date.fromisoformat(str(d))
            if d_as_date == check_date:
                current_streak += 1
                check_date -= timedelta(days=1)
            elif d_as_date < check_date:
                break
        
        # Calculate personal best streak
        best_streak = 0
        if study_dates:
            sorted_asc = sorted(set([d if isinstance(d, date) else date.fromisoformat(str(d)) for d in study_dates]))
            temp_streak = 1
            for i in range(1, len(sorted_asc)):
                if sorted_asc[i] - sorted_asc[i-1] == timedelta(days=1):
                    temp_streak += 1
                else:
                    best_streak = max(best_streak, temp_streak)
                    temp_streak = 1
            best_streak = max(best_streak, temp_streak)
        
        # Topics covered
        topics_covered = db.query(func.count(func.distinct(models.StudyRecord.topic_title))).filter(
            models.StudyRecord.user_id == user_id
        ).scalar() or 0
        
        # Last studied topic
        last_record = db.query(models.StudyRecord).filter(
            models.StudyRecord.user_id == user_id
        ).order_by(models.StudyRecord.completion_date.desc()).first()
        
        last_studied_topic = last_record.topic_title if last_record else None
        
        return {
            "status": "success",
            "user_name": user.name,
            "weekly_hours": weekly_hours,
            "study_time_today_minutes": today_records,
            "current_streak": current_streak,
            "personal_best_streak": max(best_streak, current_streak),
            "topics_covered": topics_covered,
            "last_studied_topic": last_studied_topic
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notes/generate")
async def generate_notes(request: NotesGenerateRequest, db: Session = Depends(get_db)):
    try:
        # Fetch last 20 chat messages for this topic
        messages = db.query(models.ChatMessage).filter(
            models.ChatMessage.user_id == request.user_id,
            models.ChatMessage.topic_title == request.topic
        ).order_by(models.ChatMessage.timestamp.desc()).limit(20).all()
        
        if not messages:
            raise HTTPException(status_code=400, detail="No chat history found for this topic. Chat with the AI coach first.")
        
        # Reverse to get chronological order
        chat_history = [{"sender": msg.sender, "text": msg.text} for msg in reversed(messages)]
        
        # Generate notes via AI
        notes_json = generate_study_notes(request.topic, chat_history)
        
        # Upsert - update if exists, create if not
        existing = db.query(models.StudyNote).filter(
            models.StudyNote.user_id == request.user_id,
            models.StudyNote.topic == request.topic
        ).first()
        
        if existing:
            existing.content_json = notes_json
            existing.updated_at = datetime.utcnow()
        else:
            new_note = models.StudyNote(
                user_id=request.user_id,
                topic=request.topic,
                content_json=notes_json
            )
            db.add(new_note)
        
        db.commit()
        
        return {"status": "success", "notes": json.loads(notes_json)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notes/{user_id}/{topic}")
async def get_notes(user_id: int, topic: str, db: Session = Depends(get_db)):
    try:
        note = db.query(models.StudyNote).filter(
            models.StudyNote.user_id == user_id,
            models.StudyNote.topic == topic
        ).first()
        
        if not note:
            return {"status": "success", "notes": None}
        
        return {"status": "success", "notes": json.loads(note.content_json)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quiz/generate")
async def generate_quiz_endpoint(request: QuizGenerateRequest, db: Session = Depends(get_db)):
    try:
        # Build context from multiple sources
        context_parts = []
        
        # 1. Get syllabus raw text if syllabus_id provided
        if request.syllabus_id:
            syllabus = db.query(models.Syllabus).filter(models.Syllabus.id == request.syllabus_id).first()
            if syllabus:
                context_parts.append(f"SYLLABUS CONTENT:\n{syllabus.raw_text[:3000]}")
        
        # 2. Get saved notes for this topic
        note = db.query(models.StudyNote).filter(
            models.StudyNote.user_id == request.user_id,
            models.StudyNote.topic == request.topic
        ).first()
        if note:
            context_parts.append(f"STUDY NOTES:\n{note.content_json}")
        
        # 3. Get recent chat history for context
        messages = db.query(models.ChatMessage).filter(
            models.ChatMessage.user_id == request.user_id,
            models.ChatMessage.topic_title == request.topic
        ).order_by(models.ChatMessage.timestamp.desc()).limit(10).all()
        
        if messages:
            chat_text = "\n".join([f"{m.sender}: {m.text}" for m in reversed(messages)])
            context_parts.append(f"RECENT CHAT DISCUSSION:\n{chat_text}")
        
        if not context_parts:
            context_parts.append(f"General knowledge about the topic: {request.topic}")
        
        if request.target_unit:
            context_parts.append(f"CRITICAL INSTRUCTION: The user ONLY wants a quiz covering this specific unit: {request.target_unit}. Ignore the rest of the syllabus context.")
        
        full_context = "\n\n".join(context_parts)
        
        # Generate quiz via AI
        quiz_json = generate_quiz(request.topic, full_context, request.difficulty, request.num_questions)
        
        return {"status": "success", "quiz": json.loads(quiz_json)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quiz/submit")
async def submit_quiz(request: QuizSubmitRequest, db: Session = Depends(get_db)):
    try:
        new_result = models.QuizResult(
            user_id=request.user_id,
            topic=request.topic,
            score=request.score,
            total=request.total,
            quiz_json=request.quiz_json
        )
        db.add(new_result)
        db.commit()
        db.refresh(new_result)
        
        return {
            "status": "success",
            "message": f"Quiz result saved: {request.score}/{request.total}",
            "result_id": new_result.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- AUTHENTICATION & SYNC ROUTES ---

@app.get("/api/sync-user-state/{user_id}")
async def sync_user_state(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        syllabus = db.query(models.Syllabus).filter(models.Syllabus.user_id == user_id).order_by(models.Syllabus.upload_date.desc()).first()
        
        quiz_results = db.query(models.QuizResult).filter(models.QuizResult.user_id == user_id).all()
        quizzes = [{"topic": q.topic, "score": q.score, "total": q.total, "quiz_json": json.loads(q.quiz_json)} for q in quiz_results]
        
        return {
            "status": "success",
            "last_active_topic": user.last_active_topic,
            "theme": getattr(user, "theme", "dark"),
            "reminder_time": getattr(user, "reminder_time", "18:00"),
            "syllabus_data": json.loads(syllabus.extracted_data_json) if syllabus and syllabus.extracted_data_json else None,
            "syllabus_id": syllabus.id if syllabus else None,
            "units_data": json.loads(syllabus.units_data_json) if syllabus and syllabus.units_data_json else {},
            "quiz_results": quizzes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/settings/update")
async def update_settings(request: SettingsUpdateRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == request.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if request.theme is not None:
            user.theme = request.theme
        if request.reminder_time is not None:
            user.reminder_time = request.reminder_time
            
        db.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/update-active-topic")
async def update_active_topic(request: UpdateActiveTopicRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == request.user_id).first()
        if user:
            user.last_active_topic = request.active_topic
            db.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/signup")
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        name=user.name, 
        email=user.email, 
        password=hashed_password,
        study_time=user.study_time,
        academic_level=user.academic_level,
        learning_style=user.learning_style,
        main_goal=user.main_goal,
        reminder_time=user.reminder_time or "18:00"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.id, "email": new_user.email})
    return {"status": "success", "token": access_token, "user_id": new_user.id, "name": new_user.name, "email": new_user.email}

@app.post("/api/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if not db_user or not db_user.password:
        raise HTTPException(status_code=400, detail="Invalid email or please log in with Google")
    
    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid password")
        
    access_token = create_access_token(data={"sub": db_user.id, "email": db_user.email})
    return {"status": "success", "token": access_token, "user_id": db_user.id, "name": db_user.name, "email": db_user.email}

@app.post("/api/auth/google")
async def google_auth(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "123456789-placeholder.apps.googleusercontent.com")
        idinfo = id_token.verify_oauth2_token(request.credential, google_requests.Request(), CLIENT_ID)
        
        email = idinfo['email']
        name = idinfo.get('name', 'Google User')
        google_subject_id = idinfo['sub']
        
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            user = models.User(
                name=name,
                email=email,
                auth_provider="google",
                provider_id=google_subject_id
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not user.provider_id:
            user.provider_id = google_subject_id
            user.auth_provider = "google"
            db.commit()
            
        access_token = create_access_token(data={"sub": user.id, "email": user.email})
        return {"status": "success", "token": access_token, "user_id": user.id, "name": user.name, "email": user.email}
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")