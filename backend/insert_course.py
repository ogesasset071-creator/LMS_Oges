import pymysql
import os
from dotenv import load_dotenv

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

# Connect to MySQL
conn = pymysql.connect(
    host=os.getenv("DB_HOST", "127.0.0.1"),
    user=os.getenv("DB_USER", "root"),
    password=os.getenv("DB_PASSWORD", "admin"),
    database=os.getenv("DB_NAME", "lms"),
    port=int(os.getenv("DB_PORT", "3306")),
    cursorclass=pymysql.cursors.DictCursor,
    autocommit=True
)

cursor = conn.cursor()

try:
    # 1. Insert Course
    course_sql = """
    INSERT INTO Lms_courses (tutor_id, title, description, category, price, thumbnail, is_approved, required_pp)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    course_data = (
        3, 
        "SaaS and Oil & Gas Integration Framework", 
        "A comprehensive guide on leveraging Software-as-a-Service (SaaS) technologies within the Oil and Gas sector to optimize operations and reduce costs. This course covers cloud infrastructure, data security, and predictive maintenance tools tailored for enterprise energy ecosystems.", 
        "Oil and Gas", 
        0.00, 
        "https://images.unsplash.com/photo-1518364538800-6da291ed79a5?q=80&w=2670&auto=format&fit=crop", 
        True, 
        100
    )
    cursor.execute(course_sql, course_data)
    course_id = cursor.lastrowid
    print(f"Created Course ID: {course_id}")

    # 2. Insert Unit
    unit_sql = "INSERT INTO Lms_units (course_id, title, order_num) VALUES (%s, %s, %s)"
    cursor.execute(unit_sql, (course_id, "Foundations of Energy Digitalization", 1))
    unit_id = cursor.lastrowid

    # 3. Insert Chapter
    chapter_sql = """
    INSERT INTO Lms_chapters (course_id, unit_id, title, video_url, description, content_type, order_num, pp_reward)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    chapter_data = (
        course_id, 
        unit_id, 
        "Module 1: SaaS Architecture in Upstream Operations", 
        "https://www.youtube.com/watch?v=R9j0D_2Qv7A", 
        "Understand the core components of SaaS platforms used for reservoir simulation and well management.", 
        "Video", 
        1, 
        50
    )
    cursor.execute(chapter_sql, chapter_data)
    chapter_id = cursor.lastrowid

    # 4. Insert Assignment
    assignment_sql = """
    INSERT INTO Lms_assignments (role, category, level, title, description, reward_badge, pp_reward, type, creator_id)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    assignment_data = (
        "learner", 
        "Oil and Gas", 
        "Intermediate", 
        "SaaS Implementation Strategies Quiz", 
        "Evaluate your understanding of cloud-based solutions in the energy industry.", 
        "Energy Tech Expert Badge", 
        100, 
        "assignment", 
        3
    )
    cursor.execute(assignment_sql, assignment_data)
    assignment_id = cursor.lastrowid
    print(f"Created Assignment ID: {assignment_id}")

    # 5. Insert Assignment Questions
    q_sql = """
    INSERT INTO Lms_assignment_questions (assignment_id, question_text, options, correct_options, question_type)
    VALUES (%s, %s, %s, %s, %s)
    """
    questions = [
        (assignment_id, "What is the primary benefit of SaaS in Oil and Gas operations?", "Scalability,Local hosting only,Manual updates,Lower data security", "0", "mcq"),
        (assignment_id, "Which cloud model is most commonly used for reservoir simulations?", "Public Cloud,Hybrid Cloud,Private Cloud,All of the above", "3", "mcq")
    ]
    cursor.executemany(q_sql, questions)

    print("Successfully inserted course, unit, chapter, and assignment.")

except Exception as e:
    print(f"ERROR: {e}")
finally:
    conn.close()
