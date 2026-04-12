import pymysql
import os
import json
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "admin")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "oges_asset")

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
    with conn.cursor() as cursor:
        print("Adding Assignment...")
        # 1. Add a standard Assignment
        cursor.execute("""
            INSERT INTO Lms_assignments (course_id, creator_id, title, description, type, reward_badge, category, level, role, pp_reward) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (1, 1, "React Project: Todo App", "Build a fully functional Todo List with persistence.", "assignment", "React Developer", "Frontend Development", "Intermediate", "learner", 100))
        assignment_id = cursor.lastrowid
        print(f"Added Assignment ID: {assignment_id}")

        print("Adding Quiz...")
        # 2. Add a Quiz
        cursor.execute("""
            INSERT INTO Lms_assignments (course_id, creator_id, title, description, type, reward_badge, category, level, role, pp_reward) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (1, 1, "Quick React Quiz", "Test your knowledge of React hooks and props.", "quiz", "Hooks Scout", "Frontend Development", "Beginner", "learner", 50))
        quiz_id = cursor.lastrowid
        print(f"Added Quiz ID: {quiz_id}")

        # 3. Add Questions to the Quiz
        questions = [
            {
                "question": "Which hook is used for side effects?",
                "options": ["useState", "useEffect", "useContext", "useRef"],
                "correct": "1" # index 1: useEffect
            },
            {
                "question": "What is the return value of useState?",
                "options": ["Just the state", "Just the setter", "An array with state and setter", "The state object"],
                "correct": "2" # index 2
            }
        ]

        for q in questions:
            cursor.execute("""
                INSERT INTO Lms_assignment_questions (assignment_id, question_text, options, correct_options, question_type)
                VALUES (%s, %s, %s, %s, %s)
            """, (quiz_id, q["question"], json.dumps(q["options"]), q["correct"], "mcq"))
        
        print(f"Added {len(questions)} questions to Quiz {quiz_id}")

    conn.close()
    print("Successfully added assignment and quiz.")
except Exception as e:
    print(f"ERROR: {e}")
    exit(1)
