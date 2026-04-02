import os
import traceback
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
from routers import auth, courses, user, shorts

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(title="LMS Dynamic Backend", version="2.0.0")

# --- CORS (STRICT WHITELIST) ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ogeslmshub.ogesone.com",
    "https://ogeslmshubapi.ogesone.com",
    "https://lmsoges.ogesone.com",
]

# Get extra origin from env
FRONTEND_URL = os.getenv("FRONTEND_URL")
if FRONTEND_URL and FRONTEND_URL != "*" and FRONTEND_URL not in origins:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
print(f"DEBUG: CORS enabled for {origins}")
@app.middleware("http")
async def log_requests(request: Request, call_next):
    if request.url.path == "/api/auth/login":
        body = await request.body()
        print(f"DEBUG: Request to {request.url.path} with body: {body.decode()}")
        # Re-set body so next handlers can read it
        async def receive():
            return {"type": "http.request", "body": body}
        request._receive = receive
    return await call_next(request)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"GLOBAL ERROR: {str(exc)}"
    print(error_msg)
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "msg": str(exc)},
    )

@app.on_event("startup")
def migrate_db():
    conn_gen = get_db()
    conn = next(conn_gen)
    with conn.cursor() as cursor:
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_users (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    Lms_full_name VARCHAR(255),
                    Lms_email VARCHAR(255) UNIQUE,
                    Lms_password_hash VARCHAR(255),
                    Lms_role VARCHAR(50),
                    Lms_category VARCHAR(255),
                    Lms_streak INTEGER DEFAULT 1,
                    Lms_xp INTEGER DEFAULT 0,
                    Lms_total_minutes INTEGER DEFAULT 0,
                    Lms_pp INTEGER DEFAULT 0,
                    Lms_last_login DATETIME,
                    Lms_bio TEXT,
                    Lms_avatar TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_courses (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    tutor_id INTEGER,
                    title VARCHAR(255),
                    description TEXT,
                    category VARCHAR(255),
                    price DECIMAL(10, 2),
                    thumbnail TEXT,
                    is_approved BOOLEAN DEFAULT TRUE,
                    required_pp INTEGER DEFAULT 200
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_units (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    course_id INTEGER,
                    title VARCHAR(255),
                    order_num INTEGER
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_chapters (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    course_id INTEGER,
                    unit_id INTEGER,
                    title VARCHAR(255),
                    video_url TEXT,
                    description TEXT,
                    content_type VARCHAR(50) DEFAULT 'Video',
                    order_num INTEGER,
                    pp_reward INTEGER DEFAULT 50
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_chapter_sections (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    chapter_id INTEGER,
                    heading VARCHAR(255),
                    description TEXT,
                    order_num INTEGER
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_resources (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    course_id INTEGER,
                    chapter_id INTEGER,
                    title VARCHAR(255),
                    file_type VARCHAR(50),
                    file_url TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_announcements (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    course_id INTEGER,
                    content TEXT,
                    timestamp DATETIME
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_notes (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    user_id INTEGER,
                    course_id INTEGER,
                    content TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_short_lessons (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    title VARCHAR(255),
                    description TEXT,
                    category VARCHAR(255),
                    instructor VARCHAR(255),
                    likes INTEGER DEFAULT 0,
                    comments INTEGER DEFAULT 0,
                    video_url TEXT,
                    has_quiz BOOLEAN DEFAULT FALSE,
                    quiz_quest TEXT,
                    quiz_options TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_personal_note_files (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    user_id INTEGER,
                    course_id INTEGER,
                    file_title VARCHAR(255),
                    file_url TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_progress (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    user_id INTEGER,
                    lesson_id INTEGER,
                    completed BOOLEAN DEFAULT FALSE,
                    timestamp DATETIME
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_assignments (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    role VARCHAR(50) DEFAULT 'learner',
                    category VARCHAR(255) DEFAULT 'General',
                    level VARCHAR(50) DEFAULT 'Beginner',
                    title VARCHAR(255),
                    description TEXT,
                    reward_badge VARCHAR(255),
                    pp_reward INTEGER DEFAULT 50,
                    type VARCHAR(50) DEFAULT 'assignment',
                    creator_id INTEGER
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_assignment_questions (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    assignment_id INTEGER,
                    question_text TEXT,
                    options TEXT,
                    correct_options VARCHAR(255),
                    question_type VARCHAR(50) DEFAULT 'mcq',
                    correct_answer_text TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Lms_user_assignments (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    user_id INTEGER,
                    assignment_id INTEGER,
                    status VARCHAR(50) DEFAULT 'pending',
                    timestamp DATETIME
                )
            """)
        except Exception as e:
            print(f"MIGRATION ERROR: {e}")
        
        try: cursor.execute("ALTER TABLE Lms_courses ADD COLUMN required_pp INTEGER DEFAULT 200")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_chapters ADD COLUMN pp_reward INTEGER DEFAULT 50")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_chapters ADD COLUMN description TEXT")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_chapters ADD COLUMN content_type VARCHAR(50) DEFAULT 'Video'")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_assignments ADD COLUMN type VARCHAR(50) DEFAULT 'assignment'")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_assignments ADD COLUMN role VARCHAR(50) DEFAULT 'learner'")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_assignments ADD COLUMN creator_id INTEGER")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_assignments ADD COLUMN category VARCHAR(255) DEFAULT 'General'")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_assignments ADD COLUMN level VARCHAR(255) DEFAULT 'Beginner'")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_assignments ADD COLUMN pp_reward INTEGER DEFAULT 50")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_users ADD COLUMN Lms_pp INTEGER DEFAULT 0")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_users ADD COLUMN Lms_streak INTEGER DEFAULT 1")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_users ADD COLUMN Lms_xp INTEGER DEFAULT 0")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_users ADD COLUMN Lms_total_minutes INTEGER DEFAULT 0")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_users ADD COLUMN Lms_last_login DATETIME")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_users ADD COLUMN Lms_bio TEXT")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_users ADD COLUMN Lms_avatar TEXT")
        except: pass
        try: cursor.execute("ALTER TABLE Lms_assignment_questions ADD COLUMN correct_answer_text VARCHAR(255)")
        except: pass
        conn.commit()


from fastapi.staticfiles import StaticFiles

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- ROUTERS ---
# app.include_router(auth.router, prefix="/api/auth") # Moved to top level import already or handled below
app.include_router(auth.router, prefix="/api/auth")
app.include_router(courses.router, prefix="/api")
app.include_router(user.router, prefix="/api/user")
app.include_router(shorts.router, prefix="/api")

# --- HEALTH CHECK ---
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "dynamic", "engine": "FastAPI + Raw MySQL", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 9193)), reload=True)
