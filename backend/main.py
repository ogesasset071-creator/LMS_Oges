import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
from routers import auth, courses, user, shorts

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(title="LMS Dynamic Backend", version="2.0.0")

# --- DATABASE SETUP & AUTO MIGRATION ---
@app.on_event("startup")
def migrate_db():
    conn_gen = get_db()
    conn = next(conn_gen)
    with conn.cursor() as cursor:
        try: cursor.execute("ALTER TABLE courses ADD COLUMN required_pp INTEGER DEFAULT 200")
        except: pass
        try: cursor.execute("ALTER TABLE chapters ADD COLUMN pp_reward INTEGER DEFAULT 50")
        except: pass
        try: cursor.execute("ALTER TABLE chapters ADD COLUMN description TEXT")
        except: pass
        try: cursor.execute("ALTER TABLE chapters ADD COLUMN content_type VARCHAR(50) DEFAULT 'Video'")
        except: pass
        try: cursor.execute("ALTER TABLE assignments ADD COLUMN type VARCHAR(50) DEFAULT 'assignment'")
        except: pass
        try: cursor.execute("ALTER TABLE assignments ADD COLUMN role VARCHAR(50) DEFAULT 'learner'")
        except: pass
        try: cursor.execute("ALTER TABLE assignments ADD COLUMN creator_id INTEGER")
        except: pass
        try: cursor.execute("ALTER TABLE assignments ADD COLUMN category VARCHAR(255) DEFAULT 'General'")
        except: pass
        try: cursor.execute("ALTER TABLE assignments ADD COLUMN level VARCHAR(255) DEFAULT 'Beginner'")
        except: pass
        try: cursor.execute("ALTER TABLE assignments ADD COLUMN pp_reward INTEGER DEFAULT 50")
        except: pass
        try: cursor.execute("ALTER TABLE users ADD COLUMN pp INTEGER DEFAULT 0")
        except: pass
        try: cursor.execute("ALTER TABLE assignment_questions ADD COLUMN correct_answer_text VARCHAR(255)")
        except: pass
        conn.commit()

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://lmsoges.ogesone.com")
origins = [
    "https://ogeslmshub.ogesone.com",
    "https://ogeslmshubapi.ogesone.com",
    "http://localhost:5173"
]

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if FRONTEND_URL != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print(f"Server starting - CORS enabled for: {origins}")

from fastapi.staticfiles import StaticFiles

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- ROUTERS ---
app.include_router(auth.router, prefix="/auth")
app.include_router(courses.router)
app.include_router(user.router, prefix="/user")
app.include_router(shorts.router)

# --- HEALTH CHECK ---
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "dynamic", "engine": "FastAPI + Raw MySQL", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 9193)), reload=True)
