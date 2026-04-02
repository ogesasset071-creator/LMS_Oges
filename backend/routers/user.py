from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks
import os
import shutil
from typing import List
from datetime import datetime
from database import get_db
from models import User, Progress, Course, Chapter, UserAssignment, Assignment, Unit
from schemas import UserUpdate, Token, CourseResponse, AssignmentCreate, AssignmentResponse
from auth import get_current_user, create_access_token

router = APIRouter(tags=["User & Leaderboard"])

@router.get("/me", response_model=Token)
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "access_token": "current", # compatibility 
        "token_type": "bearer", 
        "Lms_role": current_user.Lms_role,
        "Lms_full_name": current_user.Lms_full_name,
        "Lms_email": current_user.Lms_email,
        "Lms_streak": current_user.Lms_streak or 0,
        "Lms_xp": current_user.Lms_xp or 0,
        "Lms_pp": current_user.Lms_pp or 0,
        "Lms_total_minutes": current_user.Lms_total_minutes or 0,
        "Lms_bio": current_user.Lms_bio or "",
        "Lms_avatar": current_user.Lms_avatar or "",
        "Lms_category": current_user.Lms_category or "",
        "progress": [] # We don't have relationships anymore, needs a separate count/query if needed
    }

@router.get("/admins")
async def list_admins(db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT id, Lms_full_name, Lms_bio, Lms_avatar, Lms_email FROM Lms_users WHERE Lms_role = 'admin'")
        users = cursor.fetchall()
        
    return [{
        "id": u['id'],
        "Lms_full_name": u['Lms_full_name'],
        "Lms_bio": u['Lms_bio'] or "Premium Admin",
        "Lms_avatar": u['Lms_avatar'] or "",
        "Lms_email": u['Lms_email']
    } for u in users]

@router.get("/admins/{admin_id}")
async def get_admin_by_id(admin_id: int, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_users WHERE id = %s", (admin_id,))
        u = cursor.fetchone()
        
    if not u:
        raise HTTPException(status_code=404, detail="Admin not found")
        
    return {
        "id": u['id'],
        "Lms_full_name": u['Lms_full_name'],
        "Lms_bio": u['Lms_bio'] or "Premium Admin",
        "Lms_avatar": u['Lms_avatar'] or "",
        "Lms_email": u['Lms_email'],
        "Lms_role": u['Lms_role'],
        "Lms_xp": u['Lms_xp'],
        "Lms_category": u.get('Lms_category')
    }

@router.get("/admin/stats")
async def get_admin_stats(db = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.Lms_role != "admin":
        raise HTTPException(status_code=403, detail="Not an admin")
    
    with db.cursor() as cursor:
        # Get all course IDs by this educator
        cursor.execute("SELECT id FROM Lms_courses WHERE tutor_id = %s", (current_user.id,))
        course_ids = [row['id'] for row in cursor.fetchall()]

        if not course_ids:
            return {"total_courses": 0, "total_students": 0, "total_xp_given": 0}

        # Get total unique students who started any of these courses by counting progress in their chapters
        # Joining Progress, Chapter to filter by course_ids
        sql = """SELECT COUNT(DISTINCT p.user_id) as total_students 
                 FROM Lms_progress p 
                 JOIN Lms_chapters c ON p.lesson_id = c.id 
                 WHERE c.course_id IN %s"""
        cursor.execute(sql, (tuple(course_ids),))
        total_students = cursor.fetchone()['total_students']
    
    return {
        "total_courses": len(course_ids),
        "total_students": total_students,
        "total_xp_given": total_students * 50 # simplified
    }

@router.put("/profile", response_model=Token)
async def update_profile(req: UserUpdate, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    bio = req.bio if req.bio is not None else current_user.Lms_bio
    full_name = req.full_name if req.full_name is not None else current_user.Lms_full_name
    avatar = req.avatar if req.avatar is not None else current_user.Lms_avatar
    
    with db.cursor() as cursor:
        cursor.execute("UPDATE Lms_users SET Lms_full_name = %s, Lms_bio = %s, Lms_avatar = %s WHERE id = %s", (full_name, bio, avatar, current_user.id))
        db.commit()
    
    token = create_access_token({"sub": current_user.Lms_email, "role": current_user.Lms_role})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "Lms_role": current_user.Lms_role, 
        "Lms_full_name": full_name,
        "Lms_email": current_user.Lms_email,
        "Lms_streak": current_user.Lms_streak or 0,
        "Lms_xp": current_user.Lms_xp or 0,
        "Lms_total_minutes": current_user.Lms_total_minutes or 0,
        "Lms_bio": bio or "",
        "Lms_avatar": avatar or "",
        "Lms_category": current_user.Lms_category or ""
    }

@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db = Depends(get_db)):
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_extension = file.filename.split(".")[-1]
    file_name = f"avatar_{current_user.id}_{int(datetime.utcnow().timestamp())}.{file_extension}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"/uploads/{file_name}"
    with db.cursor() as cursor:
        cursor.execute("UPDATE Lms_users SET Lms_avatar = %s WHERE id = %s", (avatar_url, current_user.id))
        db.commit()
    
    return {"avatar": avatar_url}

@router.get("/courses", response_model=List[CourseResponse])
async def get_my_courses(db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        # Fetch chapter_ids from progress for this user
        cursor.execute("SELECT lesson_id FROM Lms_progress WHERE user_id = %s", (current_user.id,))
        chapter_ids = [p['lesson_id'] for p in cursor.fetchall()]
        
        if not chapter_ids: return []
        
        # Combine gathering course IDs from both direct course_id and via unit_id
        sql = """SELECT DISTINCT c.id FROM Lms_courses c 
                 LEFT JOIN Lms_units u ON c.id = u.course_id 
                 LEFT JOIN Lms_chapters ch ON (c.id = ch.course_id OR u.id = ch.unit_id) 
                 WHERE ch.id IN %s"""
        cursor.execute(sql, (tuple(chapter_ids),))
        all_course_ids = [cid['id'] for cid in cursor.fetchall() if cid['id']]
        
        if not all_course_ids: return []
        
        # Fetch actual course data with educator name
        sql = """SELECT c.*, u.Lms_full_name as tutor_name 
                 FROM Lms_courses c 
                 LEFT JOIN Lms_users u ON c.tutor_id = u.id 
                 WHERE c.id IN %s"""
        cursor.execute(sql, (tuple(all_course_ids),))
        courses_data = cursor.fetchall()
        
        res = []
        for c in courses_data:
            # All chapters for this course (direct + unit)
            sql = """SELECT id FROM Lms_chapters 
                     WHERE course_id = %s 
                     OR unit_id IN (SELECT id FROM Lms_units WHERE course_id = %s)"""
            cursor.execute(sql, (c['id'], c['id']))
            ch_ids = [ch['id'] for ch in cursor.fetchall()]
            
            # User progress count
            sql = "SELECT COUNT(*) as done FROM Lms_progress WHERE user_id = %s AND completed = TRUE AND lesson_id IN %s"
            cursor.execute(sql, (current_user.id, tuple(ch_ids)))
            done_count = cursor.fetchone()['done'] if ch_ids else 0
            
            c['progress_pct'] = (done_count / len(ch_ids) * 100) if ch_ids else 0.0
            c['tutor_name'] = c['tutor_name'] or "Premium Educator"
            res.append(c)
            
    return res


@router.post("/progress", response_model=Token)
async def update_progress(lesson_id: int, background_tasks: BackgroundTasks, completed: bool = False, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        # Check if this is the first progress for this user (Course Started)
        cursor.execute("SELECT id FROM Lms_progress WHERE user_id = %s LIMIT 1", (current_user.id,))
        first_progress = cursor.fetchone() is None
        
        cursor.execute("SELECT * FROM Lms_progress WHERE user_id = %s AND lesson_id = %s", (current_user.id, lesson_id))
        progress = cursor.fetchone()
        
        if not progress:
            cursor.execute("INSERT INTO Lms_progress (user_id, lesson_id, completed, timestamp) VALUES (%s, %s, %s, %s)", 
                           (current_user.id, lesson_id, completed, datetime.utcnow()))
            
            if first_progress:
                cursor.execute("SELECT course_id FROM Lms_chapters WHERE id = %s", (lesson_id,))
                chapter = cursor.fetchone()
                if chapter and chapter['course_id']:
                    cursor.execute("SELECT title FROM Lms_courses WHERE id = %s", (chapter['course_id'],))
                    course = cursor.fetchone()
                    if course:
                        from mail_utils import notify_course_started
                        background_tasks.add_task(notify_course_started, current_user.Lms_email, course['title'])
        else:
            if not progress['completed'] and completed:
                cursor.execute("UPDATE Lms_progress SET completed = TRUE, timestamp = %s WHERE id = %s", (datetime.utcnow(), progress['id']))
            else:
                cursor.execute("UPDATE Lms_progress SET timestamp = %s WHERE id = %s", (datetime.utcnow(), progress['id']))
        
        xp_gain = 20 if completed else 2
        pp_gain = 60
        if completed:
            cursor.execute("SELECT pp_reward FROM Lms_chapters WHERE id = %s", (lesson_id,))
            ch = cursor.fetchone()
            pp_gain = ch['pp_reward'] if ch and ch.get('pp_reward') else 100
        
        cursor.execute("UPDATE Lms_users SET Lms_xp = Lms_xp + %s, Lms_pp = Lms_pp + %s, Lms_total_minutes = Lms_total_minutes + 1 WHERE id = %s", 
                       (xp_gain, pp_gain, current_user.id))
        db.commit()

        # Update local user object for response
        current_user.Lms_xp += xp_gain
        current_user.Lms_pp += pp_gain
        current_user.Lms_total_minutes += 1
    
    return {
        "access_token": "current_token",
        "token_type": "bearer",
        "Lms_xp": current_user.Lms_xp,
        "Lms_streak": current_user.Lms_streak or 0,
        "Lms_total_minutes": current_user.Lms_total_minutes,
        "Lms_role": current_user.Lms_role,
        "Lms_full_name": current_user.Lms_full_name,
        "Lms_email": current_user.Lms_email,
        "Lms_pp": current_user.Lms_pp,
        "Lms_bio": current_user.Lms_bio or "",
        "Lms_avatar": current_user.Lms_avatar or "",
        "Lms_category": current_user.Lms_category or "",
        "progress": []
    }

@router.post("/courses/{course_id}/complete_all", response_model=Token)
async def complete_whole_course(course_id: int, background_tasks: BackgroundTasks, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        # All chapters of this course
        sql = """SELECT id FROM Lms_chapters 
                 WHERE course_id = %s 
                 OR unit_id IN (SELECT id FROM Lms_units WHERE course_id = %s)"""
        cursor.execute(sql, (course_id, course_id))
        all_ch_ids = [ch['id'] for ch in cursor.fetchall()]
        
        for ch_id in all_ch_ids:
            cursor.execute("SELECT id FROM Lms_progress WHERE user_id = %s AND lesson_id = %s", (current_user.id, ch_id))
            prog = cursor.fetchone()
            if not prog:
                cursor.execute("INSERT INTO Lms_progress (user_id, lesson_id, completed, timestamp) VALUES (%s, %s, TRUE, %s)", 
                               (current_user.id, ch_id, datetime.utcnow()))
            else:
                cursor.execute("UPDATE Lms_progress SET completed = TRUE, timestamp = %s WHERE id = %s", (datetime.utcnow(), prog['id']))
        
        cursor.execute("UPDATE Lms_users SET Lms_xp = Lms_xp + 100 WHERE id = %s", (current_user.id,))
        current_user.Lms_xp += 100
        
        cursor.execute("SELECT c.title, u.Lms_email as tutor_email FROM Lms_courses c LEFT JOIN Lms_users u ON c.tutor_id = u.id WHERE c.id = %s", (course_id,))
        course = cursor.fetchone()
        if course:
            from mail_utils import notify_course_completed, notify_student_completion_to_admin
            background_tasks.add_task(notify_course_completed, current_user.Lms_email, course['title'])
            if course['tutor_email']:
                 background_tasks.add_task(notify_student_completion_to_admin, course['tutor_email'], current_user.Lms_full_name, course['title'])
        
        db.commit()
    
    return {
        "access_token": "current_token",
        "token_type": "bearer",
        "Lms_xp": current_user.Lms_xp,
        "Lms_streak": current_user.Lms_streak or 0,
        "Lms_total_minutes": current_user.Lms_total_minutes or 0,
        "Lms_role": current_user.Lms_role,
        "Lms_full_name": current_user.Lms_full_name,
        "Lms_email": current_user.Lms_email,
        "Lms_bio": current_user.Lms_bio or "",
        "Lms_avatar": current_user.Lms_avatar or "",
        "Lms_category": current_user.Lms_category or "",
        "progress": []
    }


@router.get("/leaderboard")
async def get_leaderboard(db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT id, Lms_full_name, Lms_email, Lms_xp, Lms_pp, Lms_streak, Lms_avatar FROM Lms_users ORDER BY Lms_xp DESC LIMIT 20")
        users = cursor.fetchall()
        
    return [{
        "id": u['id'], 
        "full_name": u['Lms_full_name'], 
        "email": u['Lms_email'], 
        "xp": u['Lms_xp'] or 0, 
        "pp": u['Lms_pp'] or 0,
        "streak": u['Lms_streak'] or 0, 
        "avatar": u['Lms_avatar']
    } for u in users]

@router.get("/dashboard/stats")
async def get_dashboard_stats(db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_progress WHERE user_id = %s", (current_user.id,))
        total_progress = cursor.fetchall()
        
        progress_lessons = [p['lesson_id'] for p in total_progress]
        unique_course_ids = []
        if progress_lessons:
            sql = "SELECT DISTINCT course_id FROM Lms_chapters WHERE id IN %s"
            cursor.execute(sql, (tuple(progress_lessons),))
            unique_course_ids = [r['course_id'] for r in cursor.fetchall() if r['course_id']]
        
        completed_count = 0
        ongoing_count = 0
        
        for c_id in unique_course_ids:
            cursor.execute("SELECT id FROM Lms_chapters WHERE course_id = %s", (c_id,))
            chapter_ids = [ch['id'] for ch in cursor.fetchall()]
            if not chapter_ids: continue
            
            user_finished = [p['lesson_id'] for p in total_progress if p['lesson_id'] in chapter_ids and p['completed']]
            if len(user_finished) == len(chapter_ids):
                completed_count += 1
            else:
                ongoing_count += 1

        recent_courses = []
        if unique_course_ids:
            sql = """SELECT c.*, u.Lms_full_name as tutor_name 
                     FROM Lms_courses c 
                     LEFT JOIN Lms_users u ON c.tutor_id = u.id 
                     WHERE c.id IN %s LIMIT 5"""
            cursor.execute(sql, (tuple(unique_course_ids),))
            recent_courses_data = cursor.fetchall()
            
            for c in recent_courses_data:
                cursor.execute("SELECT COUNT(*) as cnt FROM Lms_chapters WHERE course_id = %s", (c['id'],))
                total_chapters = cursor.fetchone()['cnt']
                
                sql = "SELECT COUNT(*) as cnt FROM Lms_progress WHERE user_id = %s AND completed = TRUE AND lesson_id IN (SELECT id FROM Lms_chapters WHERE course_id = %s)"
                cursor.execute(sql, (current_user.id, c['id']))
                completed_chapters = cursor.fetchone()['cnt']
                
                pct = int((completed_chapters / total_chapters) * 100) if total_chapters > 0 else 0
                recent_courses.append({
                    "id": c['id'],
                    "title": c['title'],
                    "thumbnail": c['thumbnail'],
                    "progress_pct": pct,
                    "tutor_name": c['tutor_name'] or "Educator",
                })

        cursor.execute("SELECT COUNT(*) as rank_above FROM Lms_users WHERE Lms_xp > %s", (current_user.Lms_xp,))
        user_rank = cursor.fetchone()['rank_above'] + 1

        from datetime import datetime, timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_progress = [p for p in total_progress if p['timestamp'] >= seven_days_ago]
        
        chart_data = []
        for i in range(6, -1, -1):
            day_date = datetime.utcnow() - timedelta(days=i)
            day_str = day_date.strftime("%a")
            count = sum(1 for p in recent_progress if p['timestamp'].date() == day_date.date())
            activity_score = (count * 20) + (current_user.Lms_streak * 5 if i < (current_user.Lms_streak or 0) else 0)
            chart_data.append({"name": day_str, "activity": activity_score})

        radar_data = []
        if unique_course_ids:
            cursor.execute("SELECT category, COUNT(*) as cnt FROM Lms_courses WHERE id IN %s GROUP BY category", (tuple(unique_course_ids),))
            cat_counts = cursor.fetchall()
            radar_data = [{"subject": row['category'], "A": row['cnt'] * 15 + 50, "fullMark": 100} for row in cat_counts]
        
        if len(radar_data) < 3:
            radar_data.extend([
                {"subject": "Time Management", "A": 65, "fullMark": 100},
                {"subject": "Consistency", "A": 80, "fullMark": 100},
                {"subject": "Problem Solving", "A": 70, "fullMark": 100}
            ][:3-len(radar_data)])

        return {
            "Lms_xp": current_user.Lms_xp,
            "Lms_streak": current_user.Lms_streak,
            "Lms_total_minutes": current_user.Lms_total_minutes,
            "completed_count": completed_count,
            "ongoing_count": ongoing_count,
            "rank": user_rank,
            "recent_courses": recent_courses,
            "chart_data": chart_data,
            "radar_data": radar_data
        }

@router.get("/admin/dashboard/stats")
async def get_admin_dashboard_stats(db = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["educator", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    with db.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as cnt FROM Lms_courses WHERE tutor_id = %s", (current_user.id,))
        course_count = cursor.fetchone()['cnt']
        
        cursor.execute("SELECT COUNT(*) as cnt FROM Lms_assignments WHERE creator_id = %s", (current_user.id,))
        assign_count = cursor.fetchone()['cnt']
        
        sql = "SELECT COUNT(*) as cnt FROM Lms_user_assignments ua JOIN Lms_assignments a ON ua.assignment_id = a.id WHERE a.creator_id = %s"
        cursor.execute(sql, (current_user.id,))
        subs_count = cursor.fetchone()['cnt']
        
        sql = """SELECT COUNT(DISTINCT p.user_id) as cnt 
                 FROM Lms_progress p 
                 JOIN Lms_chapters ch ON p.lesson_id = ch.id 
                 JOIN Lms_courses c ON ch.course_id = c.id 
                 WHERE c.tutor_id = %s"""
        cursor.execute(sql, (current_user.id,))
        student_count = cursor.fetchone()['cnt']

        from datetime import datetime, timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        chart_data = []
        for i in range(7):
            day = seven_days_ago + timedelta(days=i)
            day_str = day.strftime("%a")
            sql = """SELECT COUNT(*) as cnt FROM Lms_user_assignments ua 
                     JOIN Lms_assignments a ON ua.assignment_id = a.id 
                     WHERE a.creator_id = %s AND DATE(ua.timestamp) = %s"""
            cursor.execute(sql, (current_user.id, day.date()))
            count = cursor.fetchone()['cnt']
            chart_data.append({"name": day_str, "completions": count})

        sql = """SELECT a.type, COUNT(*) as cnt 
                 FROM Lms_user_assignments ua 
                 JOIN Lms_assignments a ON ua.assignment_id = a.id 
                 WHERE a.creator_id = %s GROUP BY a.type"""
        cursor.execute(sql, (current_user.id,))
        rows = cursor.fetchall()
        
    return {
        "course_count": course_count,
        "assign_count": assign_count,
        "subs_count": subs_count,
        "student_count": student_count,
        "chart_data": chart_data,
        "pie_data": [{"name": row['type'].capitalize(), "value": row['cnt']} for row in rows]
    }


@router.get("/assignments")
async def get_assignments(db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as cnt FROM Lms_progress WHERE user_id = %s AND completed = TRUE", (current_user.id,))
        comp_count = cursor.fetchone()['cnt']
        
        user_level = "Beginner"
        if comp_count >= 2: user_level = "Intermediate"
        if comp_count >= 5: user_level = "Advanced"

        cursor.execute("SELECT COUNT(*) as cnt FROM Lms_assignments")
        if cursor.fetchone()['cnt'] == 0:
            professional_tracks = ["Frontend Development", "Backend Development", "Data Science", "Artificial Intelligence", "Cloud Computing"]
            for track in professional_tracks:
                cursor.execute("INSERT INTO Lms_assignments (role, category, level, title, description, reward_badge, type) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                               ("learner", track, "Beginner", f"{track}: Foundation Quiz", f"Basic knowledge of {track}.", f"{track} Rookie 🥉", "quiz"))
                a_id = cursor.lastrowid
                cursor.execute("INSERT INTO Lms_assignment_questions (assignment_id, question_text, options, question_type) VALUES (%s, %s, %s, %s)",
                               (a_id, f"What is the primary goal of {track}?", "Scale,AI,Data,UI", "mcq"))
            db.commit()

        user_cat = current_user.Lms_category or "General"
        sql = "SELECT * FROM Lms_assignments WHERE role = 'learner' AND (category = %s OR category = 'General')"
        cursor.execute(sql, (user_cat,))
        assigns_data = cursor.fetchall()
        
        cursor.execute("SELECT assignment_id FROM Lms_user_assignments WHERE user_id = %s AND status = 'completed'", (current_user.id,))
        user_done_ids = [ua['assignment_id'] for ua in cursor.fetchall()]
        
        res = []
        for a in assigns_data:
            cursor.execute("SELECT * FROM Lms_assignment_questions WHERE assignment_id = %s", (a['id'],))
            questions = cursor.fetchall()
            res.append({
                "id": a['id'], "title": a['title'], "description": a['description'], "type": a['type'], 
                "category": a['category'], "level": a['level'], "reward_badge": a['reward_badge'], "pp_reward": a['pp_reward'] or 50,
                "role": a['role'], "completed": a['id'] in user_done_ids, "questions": questions
            })
    return res

@router.get("/assignments/{id}", response_model=AssignmentResponse)
async def get_assignment_detail(id: int, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_assignments WHERE id = %s", (id,))
        a = cursor.fetchone()
        if not a: raise HTTPException(status_code=404, detail="Assignment not found")
        cursor.execute("SELECT * FROM Lms_assignment_questions WHERE assignment_id = %s", (id,))
        a['questions'] = cursor.fetchall()
    return a

@router.post("/assignments/{id}/complete")
async def complete_assignment(id: int, background_tasks: BackgroundTasks, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_user_assignments WHERE user_id = %s AND assignment_id = %s", (current_user.id, id))
        if cursor.fetchone(): return {"status": "already_done"}
        
        cursor.execute("SELECT * FROM Lms_assignments WHERE id = %s", (id,))
        assignment = cursor.fetchone()
        if not assignment: raise HTTPException(status_code=404, detail="Not found")
            
        cursor.execute("INSERT INTO Lms_user_assignments (user_id, assignment_id, status, timestamp) VALUES (%s, %s, 'completed', %s)", 
                       (current_user.id, id, datetime.utcnow()))
        
        pp_inc = assignment['pp_reward'] or 50
        cursor.execute("UPDATE Lms_users SET Lms_pp = Lms_pp + %s WHERE id = %s", (pp_inc, current_user.id))
        
        current_badges = (current_user.Lms_badges or "").split(",")
        if assignment['reward_badge'] not in current_badges:
            new_badges = f"{current_user.Lms_badges},{assignment['reward_badge']}" if current_user.Lms_badges else assignment['reward_badge']
            cursor.execute("UPDATE Lms_users SET Lms_badges = %s WHERE id = %s", (new_badges, current_user.id))
            current_user.Lms_badges = new_badges
            
        db.commit()
    
    from mail_utils import notify_assignment_completed, notify_quiz_completed, notify_student_completion_to_admin
    if assignment['type'] == "quiz":
        background_tasks.add_task(notify_quiz_completed, current_user.Lms_email, assignment['title'])
    else:
        background_tasks.add_task(notify_assignment_completed, current_user.Lms_email, assignment['title'])
        
    if assignment.get('creator_id'):
        with db.cursor() as cursor:
            cursor.execute("SELECT Lms_email FROM Lms_users WHERE id = %s", (assignment['creator_id'],))
            creator = cursor.fetchone()
            if creator:
                background_tasks.add_task(notify_student_completion_to_admin, creator['Lms_email'], current_user.Lms_full_name, assignment['title'])
        
    return {"status": "success", "badges": current_user.badges}

@router.post("/admin/assignments", response_model=AssignmentResponse)
async def create_new_assignment(req: AssignmentCreate, background_tasks: BackgroundTasks, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.Lms_role not in ["educator", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    cat, lvl = req.category, req.level
    with db.cursor() as cursor:
        if req.courseId:
            cursor.execute("SELECT category, level FROM Lms_courses WHERE id = %s", (req.courseId,))
            c = cursor.fetchone()
            if c: cat, lvl = c['category'], c['level']

        cursor.execute("""INSERT INTO Lms_assignments (title, description, reward_badge, role, creator_id, category, level, pp_reward, type) 
                          VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""", 
                       (req.title, req.description, req.reward_badge or "Badge", req.role or "learner", current_user.id, cat or "General", lvl or "Beginner", req.pp_reward or 50, req.type or "assignment"))
        a_id = cursor.lastrowid
        
        for q in req.questions:
            cursor.execute("""INSERT INTO Lms_assignment_questions (assignment_id, question_text, options, correct_options, question_type, correct_answer_text) 
                              VALUES (%s, %s, %s, %s, %s, %s)""",
                           (a_id, q.question, ",".join(q.options) if q.options else "", q.correct_options or "0", q.question_type or "mcq", q.correct_answer_text))
        db.commit()
        
        cursor.execute("SELECT * FROM Lms_assignments WHERE id = %s", (a_id,))
        new_a = cursor.fetchone()
        cursor.execute("SELECT * FROM Lms_assignment_questions WHERE assignment_id = %s", (a_id,))
        new_a['questions'] = cursor.fetchall()

    from mail_utils import notify_new_assignment, notify_new_quiz
    if new_a['type'] == "quiz":
        background_tasks.add_task(notify_new_quiz, current_user.Lms_email, new_a['title'])
    else:
        background_tasks.add_task(notify_new_assignment, current_user.Lms_email, new_a['title'])
    
    return new_a

@router.delete("/admin/assignments/{id}")
async def delete_assignment(id: int, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["educator", "admin"]: raise HTTPException(status_code=403, detail="Permission denied")
    with db.cursor() as cursor:
        cursor.execute("SELECT creator_id FROM Lms_assignments WHERE id = %s", (id,))
        a = cursor.fetchone()
        if not a: raise HTTPException(status_code=404, detail="Not found")
        if a['creator_id'] != current_user.id and current_user.Lms_role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
        cursor.execute("DELETE FROM Lms_assignments WHERE id = %s", (id,))
        db.commit()
    return {"status": "success"}

@router.delete("/admin/assignments/{id}")
async def delete_assignment(id: int, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.Lms_role not in ["educator", "admin"]: raise HTTPException(status_code=403, detail="Permission denied")
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_assignments WHERE creator_id = %s", (current_user.id,))
        assigns = cursor.fetchall()
        for a in assigns:
            cursor.execute("SELECT * FROM Lms_assignment_questions WHERE assignment_id = %s", (a['id'],))
            a['questions'] = cursor.fetchall()
    return assigns

@router.get("/admin/submissions")
async def get_all_submissions(db = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.Lms_role not in ["educator", "admin"]: raise HTTPException(status_code=403, detail="Permission denied")
    with db.cursor() as cursor:
        sql = """SELECT ua.*, u.Lms_full_name as student_name, u.Lms_email as student_email, a.title, a.type, a.reward_badge 
                 FROM Lms_user_assignments ua 
                 JOIN Lms_users u ON ua.user_id = u.id 
                 JOIN Lms_assignments a ON ua.assignment_id = a.id 
                 WHERE a.creator_id = %s"""
        cursor.execute(sql, (current_user.id,))
        uas = cursor.fetchall()
    return [{
        "id": ua['id'], "type": ua['type'] or "assignment", "student_name": ua['student_name'], "student_email": ua['student_email'],
        "title": ua['title'], "status": ua['status'], "timestamp": ua['timestamp'].isoformat() if ua['timestamp'] else None, "reward": ua['reward_badge']
    } for ua in uas]

@router.get("/admin/completions")
async def get_admin_course_completions(db = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.Lms_role not in ["educator", "admin"]: raise HTTPException(status_code=403, detail="Permission denied")
    res = []
    with db.cursor() as cursor:
        cursor.execute("SELECT id, title FROM Lms_courses WHERE tutor_id = %s", (current_user.id,))
        my_courses = cursor.fetchall()
        for c in my_courses:
            cursor.execute("SELECT id FROM Lms_chapters WHERE course_id = %s", (c['id'],))
            ch_ids = [ch['id'] for ch in cursor.fetchall()]
            if not ch_ids: continue
            sql = """SELECT u.Lms_full_name, u.Lms_email 
                     FROM Lms_users u 
                     JOIN Lms_progress p ON u.id = p.user_id 
                     WHERE p.lesson_id IN %s AND p.completed = TRUE 
                     GROUP BY u.id HAVING COUNT(p.id) = %s"""
            cursor.execute(sql, (tuple(ch_ids), len(ch_ids)))
            for u in cursor.fetchall():
                res.append({"course_title": c['title'], "student_name": u['Lms_full_name'], "student_email": u['Lms_email'], "timestamp": datetime.utcnow().isoformat()})
    return res




