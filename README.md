# Synapse AI Academic Copilot

Synapse is a full-stack AI study assistant for students. It helps learners turn a syllabus PDF into an actionable study plan, chat with an AI tutor, generate notes and quizzes, and track their progress with a dashboard and streak system.

## What Synapse does

- Upload a syllabus PDF and extract course topics automatically
- Build a structured study plan from the uploaded syllabus
- Chat with an AI study coach for explanations and guidance
- Generate notes and quizzes from your learning content
- Track study time, streaks, topics covered, and badges
- Support login with email/password and Google OAuth

## Tech stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: Python, FastAPI, SQLAlchemy
- Authentication: JWT + bcrypt
- AI: Google Gemini 2.5 Flash + LangChain
- Database: SQLite for local development, PostgreSQL for deployment
- Vector search: ChromaDB

## Project structure

- backend/: FastAPI app, database models, AI logic, auth routes
- frontend/: React frontend with pages for dashboard, study sessions, syllabus, login, and onboarding
- docker-compose.yml: local PostgreSQL and ChromaDB containers
- render.yaml: deployment configuration for Render

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- A Google Gemini API key

## Backend setup

1. Go to the backend folder:
   ```powershell
   cd backend
   ```

2. Copy the example environment file and fill in your values:
   ```powershell
   copy .env.example .env
   ```

3. Edit the backend/.env file and set:
   - DATABASE_URL
   - GEMINI_API_KEY
   - JWT_SECRET_KEY
   - CORS_ORIGINS

4. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

5. Start the backend server:
   ```powershell
   $env:DATABASE_URL='sqlite:///./synapse.db'
   $env:GEMINI_API_KEY='your-gemini-key'
   $env:JWT_SECRET_KEY='your-long-random-secret'
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```

The backend API will be available at:
- http://127.0.0.1:8000/
- http://127.0.0.1:8000/docs

## Frontend setup

1. Go to the frontend folder:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm run dev
   ```

The frontend will be available at:
- http://127.0.0.1:5173/

## Optional local services

If you want to use PostgreSQL and ChromaDB locally, run:

```powershell
docker compose up -d
```

## How to use Synapse

1. Open the app in your browser.
2. Create an account or log in with Google.
3. Complete onboarding and set your goals.
4. Upload a syllabus PDF from the syllabus section.
5. Review the extracted topics and generated study plan.
6. Open the study session page to chat with the AI coach.
7. Generate notes and quizzes for the topic you are studying.
8. Track your daily progress on the dashboard.

## Notes

- The real local environment values should stay in the backend/.env file and should not be committed to Git.
- The backend expects the Gemini API key and JWT secret to be available through environment variables.
- For deployment, use real environment variables provided by the hosting platform instead of local files.
