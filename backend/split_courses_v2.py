import pymysql
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

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
    combined_id = 53
    # 0. Delete related records for Course 53
    cursor.execute("DELETE FROM Lms_resources WHERE course_id = %s", (combined_id,))
    cursor.execute("DELETE FROM Lms_chapter_sections WHERE chapter_id IN (SELECT id FROM Lms_chapters WHERE course_id = %s)", (combined_id,))
    cursor.execute("DELETE FROM Lms_chapters WHERE course_id = %s", (combined_id,))
    cursor.execute("DELETE FROM Lms_units WHERE course_id = %s", (combined_id,))
    # Assignment questions first
    cursor.execute("DELETE FROM Lms_assignment_questions WHERE assignment_id IN (SELECT id FROM Lms_assignments WHERE creator_id = 3 AND category = 'Oil and Gas')")
    cursor.execute("DELETE FROM Lms_assignments WHERE creator_id = 3 AND category = 'Oil and Gas'")
    cursor.execute("DELETE FROM Lms_courses WHERE id = %s", (combined_id,))
    print(f"Cleaned up combined course ID {combined_id}.")

    # 1. Insert SaaS Course
    course_saas_sql = """
    INSERT INTO Lms_courses (tutor_id, title, description, category, price, thumbnail, is_approved, required_pp)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    saas_data = (
        3, 
        "Enterprise SaaS Architecture & Business Models", 
        "Learn cloud multi-tenancy, scalable DB design, and recurring revenue models for high-availability enterprise applications.", 
        "SaaS", 
        0.00, 
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop", 
        True, 
        150
    )
    cursor.execute(course_saas_sql, saas_data)
    saas_id = cursor.lastrowid
    cursor.execute("INSERT INTO Lms_units (course_id, title, order_num) VALUES (%s, %s, %s)", (saas_id, "SaaS Infrastructure", 1))
    saas_unit_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO Lms_chapters (course_id, unit_id, title, video_url, description, content_type, order_num, pp_reward)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (saas_id, saas_unit_id, "Chapter 1: Multi-tenancy Design Patterns", "https://www.youtube.com/watch?v=R9j0D_2Qv7A", "Building secure multi-tenant data layers.", "Video", 1, 50))
    print(f"Created SaaS Course ID: {saas_id}")

    # 2. Insert Oil and Gas Course
    course_og_sql = """
    INSERT INTO Lms_courses (tutor_id, title, description, category, price, thumbnail, is_approved, required_pp)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    og_data = (
        3, 
        "Advanced Petroleum Engineering & Oil Field Operations", 
        "Technical masterclass in reservoir geology, drilling, and environmental compliance in modern oil field management.", 
        "Oil and Gas", 
        0.00, 
        "https://images.unsplash.com/photo-1518364538800-6da291ed79a5?q=80&w=2670&auto=format&fit=crop", 
        True, 
        200
    )
    cursor.execute(course_og_sql, og_data)
    og_id = cursor.lastrowid
    cursor.execute("INSERT INTO Lms_units (course_id, title, order_num) VALUES (%s, %s, %s)", (og_id, "Upstream Petroleum Basics", 1))
    og_unit_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO Lms_chapters (course_id, unit_id, title, video_url, description, content_type, order_num, pp_reward)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (og_id, og_unit_id, "Chapter 1: Reservoir Geology Analysis", "https://www.youtube.com/watch?v=R9j0D_2Qv7A", "Basic principles of reservoir geology.", "Video", 1, 60))
    print(f"Created Oil & Gas Course ID: {og_id}")

    print("Individual courses for SaaS and Oil & Gas are now live!")

except Exception as e:
    print(f"ERROR: {e}")
finally:
    conn.close()
