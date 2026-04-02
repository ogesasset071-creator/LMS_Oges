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
    # Get the latest course IDs created earlier
    cursor.execute("SELECT id FROM Lms_courses WHERE category = 'SaaS' ORDER BY id DESC LIMIT 1")
    saas_id = cursor.fetchone()['id']
    cursor.execute("SELECT id FROM Lms_courses WHERE category = 'Oil and Gas' ORDER BY id DESC LIMIT 1")
    og_id = cursor.fetchone()['id']

    print(f"Updating SaaS Course ID {saas_id} and Oil & Gas Course ID {og_id}")

    # 1. Update SaaS Chapter Video
    cursor.execute("""
    UPDATE Lms_chapters SET 
    video_url = %s,
    description = %s
    WHERE course_id = %s
    """, ("https://www.youtube.com/watch?v=V9S_6O1t40Y", "A comprehensive guide to SaaS Architecture, scalability, and multi-tenant database design.", saas_id))
    print("Updated SaaS chapter video.")

    # 2. Add SaaS Assignment
    cursor.execute("""
    INSERT INTO Lms_assignments (role, category, level, title, description, reward_badge, pp_reward, type, creator_id)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, ("learner", "SaaS", "Beginner", "SaaS Fundamentals Quiz", "Test your knowledge on SaaS deployment models and multi-tenancy architecture.", "SaaS Pro Badge", 100, "assignment", 3))
    saas_assign_id = cursor.lastrowid
    
    saas_questions = [
        (saas_assign_id, "What is a core benefit of multi-tenant SaaS architecture?", "Lower operational costs,Manual software updates,Single database per user,Offline access only", "0", "mcq"),
        (saas_assign_id, "Which model is SaaS usually associated with?", "Recurring Subscription,One-time license,Physical hardware,Direct download", "0", "mcq")
    ]
    cursor.executemany("INSERT INTO Lms_assignment_questions (assignment_id, question_text, options, correct_options, question_type) VALUES (%s, %s, %s, %s, %s)", saas_questions)
    print("Added SaaS assignment and questions.")

    # 3. Update Oil & Gas Chapter Video
    cursor.execute("""
    UPDATE Lms_chapters SET 
    video_url = %s,
    description = %s
    WHERE course_id = %s
    """, ("https://www.youtube.com/watch?v=0P3HeZ9p_o8", "Understand the geological formation of oil and natural gas and the basics of petroleum engineering.", og_id))
    print("Updated Oil & Gas chapter video.")

    # 4. Add Oil & Gas Assignment
    cursor.execute("""
    INSERT INTO Lms_assignments (role, category, level, title, description, reward_badge, pp_reward, type, creator_id)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, ("learner", "Oil and Gas", "Intermediate", "Geology and Petroleum Mastery Test", "Evaluate your understanding of petroleum formation and upstream operations.", "Energy Scholar Badge", 150, "assignment", 3))
    og_assign_id = cursor.lastrowid
    
    og_questions = [
        (og_assign_id, "How are oil and gas formed?", "Organic matter pressure & heat,Volcanic eruptions,Mining coal,Rainwater filtration", "0", "mcq"),
        (og_assign_id, "Where are the largest oil reserves usually found?", "Sedimentary basins,Desert sand only,River beds,Deep sea volcanoes", "0", "mcq")
    ]
    cursor.executemany("INSERT INTO Lms_assignment_questions (assignment_id, question_text, options, correct_options, question_type) VALUES (%s, %s, %s, %s, %s)", og_questions)
    print("Added Oil & Gas assignment and questions.")

    print("Genuine links and assignments integrated successfully!")

except Exception as e:
    print(f"ERROR: {e}")
finally:
    conn.close()
