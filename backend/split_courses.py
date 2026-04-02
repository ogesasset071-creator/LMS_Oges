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
    # 0. Clean up previous combined course (Course ID 53)
    cursor.execute("DELETE FROM Lms_courses WHERE id = 53")
    print("Deleted previous combined course ID 53.")

    # 1. Insert SaaS Course
    course_saas_sql = """
    INSERT INTO Lms_courses (tutor_id, title, description, category, price, thumbnail, is_approved, required_pp)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    saas_data = (
        3, 
        "Enterprise SaaS Architecture & Business Models", 
        "Dive deep into the world of Cloud Software-as-a-Service. Learn about multi-tenancy architecture, scalable database design, recurring revenue models, and modern CI/CD pipelines for high-availability enterprise applications.", 
        "SaaS", 
        0.00, 
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop", 
        True, 
        150
    )
    cursor.execute(course_saas_sql, saas_data)
    saas_id = cursor.lastrowid
    print(f"Created SaaS Course ID: {saas_id}")

    # Insert SaaS Unit & Chapter
    cursor.execute("INSERT INTO Lms_units (course_id, title, order_num) VALUES (%s, %s, %s)", (saas_id, "SaaS Infrastructure", 1))
    saas_unit_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO Lms_chapters (course_id, unit_id, title, video_url, description, content_type, order_num, pp_reward)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (saas_id, saas_unit_id, "Chapter 1: Multi-tenancy Design Patterns", "https://www.youtube.com/watch?v=R9j0D_2Qv7A", "Learn how to build secure multi-tenant data layers.", "Video", 1, 50))

    # 2. Insert Oil and Gas Course
    course_og_sql = """
    INSERT INTO Lms_courses (tutor_id, title, description, category, price, thumbnail, is_approved, required_pp)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    og_data = (
        3, 
        "Advanced Petroleum Engineering & Oil Field Operations", 
        "A technical masterclass in petroleum engineering. Covering reservoir geology, advanced drilling techniques, well productivity optimization, and environmental compliance in modern oil field management.", 
        "Oil and Gas", 
        0.00, 
        "https://images.unsplash.com/photo-1518364538800-6da291ed79a5?q=80&w=2670&auto=format&fit=crop", 
        True, 
        200
    )
    cursor.execute(course_og_sql, og_data)
    og_id = cursor.lastrowid
    print(f"Created Oil & Gas Course ID: {og_id}")

    # Insert Oil and Gas Unit & Chapter
    cursor.execute("INSERT INTO Lms_units (course_id, title, order_num) VALUES (%s, %s, %s)", (og_id, "Upstream Petroleum Basics", 1))
    og_unit_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO Lms_chapters (course_id, unit_id, title, video_url, description, content_type, order_num, pp_reward)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (og_id, og_unit_id, "Chapter 1: Reservoir Geology and Fluid Analysis", "https://www.youtube.com/watch?v=R9j0D_2Qv7A", "Basic principles of reservoir engineering.", "Video", 1, 60))

    print("Successfully created individual courses for SaaS and Oil & Gas.")

except Exception as e:
    print(f"ERROR: {e}")
finally:
    conn.close()
