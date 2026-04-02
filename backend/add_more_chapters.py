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
    # Course IDs
    saas_id = 54
    og_id = 55
    
    # Get Unit IDs
    cursor.execute("SELECT id FROM Lms_units WHERE course_id = %s", (saas_id,))
    saas_unit_id = cursor.fetchone()['id']
    cursor.execute("SELECT id FROM Lms_units WHERE course_id = %s", (og_id,))
    og_unit_id = cursor.fetchone()['id']

    print(f"Adding extra chapters to SaaS (Unit {saas_unit_id}) and Oil & Gas (Unit {og_unit_id})")

    # 1. SaaS Extra Chapters
    saas_chapters = [
        (saas_id, saas_unit_id, "Chapter 2: Scalable API Design with GraphQL", "https://www.youtube.com/watch?v=yWzKjpno_9M", "Introduction to building scalable APIs for multi-tenant SaaS environments.", "Video", 2, 50),
        (saas_id, saas_unit_id, "Chapter 3: SaaS Security & Compliance", "https://www.youtube.com/watch?v=P_Vf4S_FqA0", "Crucial overview of SOC2, GDPR, and enterprise security in the cloud.", "Video", 3, 75),
        (saas_id, saas_unit_id, "Chapter 4: Subscription Billing Workflows", "https://www.youtube.com/watch?v=72beLp8X8m8", "Implementing recurring billing and subscription management with modern Stripe integrations.", "Video", 4, 100)
    ]
    cursor.executemany("""
    INSERT INTO Lms_chapters (course_id, unit_id, title, video_url, description, content_type, order_num, pp_reward)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, saas_chapters)
    print("Added 3 more chapters to SaaS.")

    # 2. Oil & Gas Extra Chapters
    og_chapters = [
        (og_id, og_unit_id, "Chapter 2: Well Drilling Techniques & Equipment", "https://www.youtube.com/watch?v=q6t8r6j8J00", "A detailed look at modern drilling rigs and the technical process of oil extraction.", "Video", 2, 60),
        (og_id, og_unit_id, "Chapter 3: Reservoir Productivity & Enhancement", "https://www.youtube.com/watch?v=E-DIdm9XlqI", "How to optimize well production and use enhanced oil recovery techniques.", "Video", 3, 80),
        (og_id, og_unit_id, "Chapter 4: Offshore Safety & Environment", "https://www.youtube.com/watch?v=3H6XW_5m58E", "Essential safety protocols and environmental regulations for offshore drilling platforms.", "Video", 4, 120)
    ]
    cursor.executemany("""
    INSERT INTO Lms_chapters (course_id, unit_id, title, video_url, description, content_type, order_num, pp_reward)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, og_chapters)
    print("Added 3 more chapters to Oil & Gas.")

    print("Platform curriculum expanded successfully!")

except Exception as e:
    print(f"ERROR: {e}")
finally:
    conn.close()
