import pymysql
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3007"))
DB_NAME = os.getenv("DB_NAME", "oges_asset")

print(f"Connecting to {DB_HOST}:{DB_PORT} as {DB_USER}...")

try:
    conn = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )
except Exception as e:
    print(f"Connection failed: {e}")
    exit(1)

def seed():
    with conn.cursor() as cursor:
        print("Inserting sample data...")
        
        # 1. Create Admin
        admin_pass = hash_password("admin123")
        cursor.execute("""
            INSERT INTO Lms_users (Lms_full_name, Lms_email, Lms_password_hash, Lms_role, Lms_category) 
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE Lms_role = 'admin'
        """, ("Admin Oges", "admin@oges.com", admin_pass, "admin", "Management"))
        
        cursor.execute("SELECT id FROM Lms_users WHERE Lms_email = %s", ("admin@oges.com",))
        admin_id = cursor.fetchone()['id']

        # 2. Create Learner
        learner_pass = hash_password("learner123")
        cursor.execute("""
            INSERT INTO Lms_users (Lms_full_name, Lms_email, Lms_password_hash, Lms_role, Lms_category) 
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE Lms_role = 'learner'
        """, ("Learner Oges", "learner@oges.com", learner_pass, "learner", "Frontend Development"))
        
        cursor.execute("SELECT id FROM Lms_users WHERE Lms_email = %s", ("learner@oges.com",))
        learner_id = cursor.fetchone()['id']

        # 3. Add Course
        cursor.execute("""
            INSERT INTO Lms_courses (tutor_id, title, description, category, price, thumbnail, required_pp) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (admin_id, "Mastering Modern React", "Deep dive into React Hooks, Context, and Performance.", "Frontend Development", 0, "https://images.unsplash.com/photo-1633356122544-f134324a6cee", 200))
        course_id = cursor.lastrowid

        # 4. Add Unit
        cursor.execute("INSERT INTO Lms_units (course_id, title, order_num) VALUES (%s, %s, %s)", (course_id, "React Foundations", 1))
        unit_id = cursor.lastrowid

        # 5. Add Chapter (Lesson)
        cursor.execute("""
            INSERT INTO Lms_chapters (unit_id, title, video_url, description, content_type, order_num, pp_reward) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (unit_id, "Understanding Hooks", "https://vimeo.com/61189569", "Basics of useState and useEffect.", "Video", 1, 100))
        
        # 6. Add Assignment
        cursor.execute("""
            INSERT INTO Lms_assignments (course_id, creator_id, title, description, type, reward_badge, category, level, role) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (course_id, admin_id, "React Hooks Quiz", "Test your knowledge on common hooks.", "quiz", "Hooks Master", "Frontend Development", "Intermediate", "learner"))
        assign_id = cursor.lastrowid

        # 8. Add Another Course
        cursor.execute("""
            INSERT INTO Lms_courses (tutor_id, title, description, category, price, thumbnail, required_pp) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (admin_id, "Backend Mastery with FastAPI", "Build high-performance APIs using Python and FastAPI.", "Backend Development", 0, "https://images.unsplash.com/photo-1542831371-29b0f74f9713", 400))
        course_id_2 = cursor.lastrowid

        cursor.execute("INSERT INTO Lms_units (course_id, title, order_num) VALUES (%s, %s, %s)", (course_id_2, "API Design", 1))
        unit_id_2 = cursor.lastrowid

        cursor.execute("""
            INSERT INTO Lms_chapters (unit_id, title, video_url, description, content_type, order_num, pp_reward) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (unit_id_2, "Pydantic Models", "https://vimeo.com/61189570", "Validation and serialization.", "Video", 1, 150))
        
        print(f"Seeding complete! Admin: admin@oges.com / admin123, Learner: learner@oges.com / learner123")

if __name__ == "__main__":
    seed()
