from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks
import os
import shutil
from datetime import datetime
from typing import List
from database import get_db
from models import User, Course, Chapter, ShortLesson, Unit, ChapterSection, Resource, Announcement, Note, PersonalNoteFile
from schemas import CourseCreate, CourseResponse, CourseListResponse, ShortLessonResponse
from auth import get_current_user
from pydantic import BaseModel
import math

class InteractRequest(BaseModel):
    action: str

class AnnouncementCreate(BaseModel):
    content: str

class NoteCreate(BaseModel):
    content: str

router = APIRouter(tags=["Courses"])

@router.post("/courses", response_model=CourseResponse)
async def create_course(course_data: CourseCreate, background_tasks: BackgroundTasks, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.Lms_role != "admin" and current_user.Lms_role != "educator":
        raise HTTPException(status_code=403, detail="Only admins/educators can upload courses")

    with db.cursor() as cursor:
        cursor.execute("""INSERT INTO Lms_courses (tutor_id, title, description, category, price, thumbnail, is_approved) 
                          VALUES (%s, %s, %s, %s, %s, %s, %s)""", 
                       (current_user.id, course_data.title, course_data.description, course_data.category, course_data.price, course_data.thumbnail, True))
        course_id = cursor.lastrowid
        
        # Handle new units structure
        if course_data.units:
            for ui, unit_data in enumerate(course_data.units):
                cursor.execute("INSERT INTO Lms_units (course_id, title, order_num) VALUES (%s, %s, %s)", 
                               (course_id, unit_data.title, unit_data.order_num if unit_data.order_num > 0 else ui + 1))
                unit_id = cursor.lastrowid
                
                for ci, chap in enumerate(unit_data.chapters):
                    cursor.execute("""INSERT INTO Lms_chapters (course_id, unit_id, title, video_url, description, content_type, order_num, pp_reward) 
                                      VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""", 
                                   (course_id, unit_id, chap.title, chap.video_url, chap.description, chap.content_type, chap.order_num if chap.order_num > 0 else ci + 1, chap.pp_reward or 50))
                    chapter_id = cursor.lastrowid
                    
                    for si, sec in enumerate(chap.sections):
                        cursor.execute("INSERT INTO Lms_chapter_sections (chapter_id, heading, description, order_num) VALUES (%s, %s, %s, %s)",
                                       (chapter_id, sec.heading, sec.description, sec.order_num if sec.order_num > 0 else si + 1))
                    
                    for res in (chap.resources or []):
                        cursor.execute("INSERT INTO Lms_resources (course_id, chapter_id, title, file_type, file_url) VALUES (%s, %s, %s, %s, %s)",
                                       (course_id, chapter_id, res.title, res.file_type, res.file_url))
            
            for res in (course_data.resources or []):
                cursor.execute("INSERT INTO Lms_resources (course_id, title, file_type, file_url) VALUES (%s, %s, %s, %s)",
                               (course_id, res.title, res.file_type, res.file_url))
        else:
            for i, chap in enumerate(course_data.chapters):
                cursor.execute("INSERT INTO Lms_chapters (course_id, title, video_url, order_num) VALUES (%s, %s, %s, %s)",
                               (course_id, chap.title, chap.video_url, chap.order_num if chap.order_num > 0 else i + 1))
        
        db.commit()
    
    from mail_utils import notify_new_course
    background_tasks.add_task(notify_new_course, current_user.Lms_email, course_data.title)
    
    return await get_course(course_id, db)

@router.get("/courses", response_model=CourseListResponse)
async def get_courses(page: int = 1, limit: int = 12, category: str = "All", db = Depends(get_db)):
    with db.cursor() as cursor:
        where_clause = ""
        # print(f"Category: {category}")
        params = []
        if category != "All":
            where_clause = "WHERE category = %s"
            params.append(category)
            
        cursor.execute(f"SELECT COUNT(*) as total FROM Lms_courses {where_clause}", tuple(params))
        total = cursor.fetchone()['total']
        
        offset = (page - 1) * limit
        sql = f"""SELECT c.*, u.Lms_full_name as tutor_name 
                 FROM Lms_courses c 
                 LEFT JOIN Lms_users u ON c.tutor_id = u.id 
                 {where_clause} 
                 LIMIT %s OFFSET %s"""
        cursor.execute(sql, tuple(params + [limit, offset]))
        courses = cursor.fetchall()
        
        for c in courses:
            c['tutor_name'] = c['tutor_name'] or "Premium Educator"
    
    return {
        "courses": courses,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if limit > 0 else 0
    }

@router.get("/admin/courses", response_model=List[CourseResponse])
async def get_admin_courses(db = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.Lms_role not in ["admin", "educator"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    with db.cursor() as cursor:
        cursor.execute("SELECT id FROM Lms_courses WHERE tutor_id = %s", (current_user.id,))
        course_ids = [r['id'] for r in cursor.fetchall()]
        
    res = []
    for cid in course_ids:
        res.append(await get_course(cid, db))
    return res

@router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course(course_id: int, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT c.*, u.Lms_full_name as tutor_name FROM Lms_courses c LEFT JOIN Lms_users u ON c.tutor_id = u.id WHERE c.id = %s", (course_id,))
        course = cursor.fetchone()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course['tutor_name'] = course['tutor_name'] or "Premium Educator"
        
        # Units
        cursor.execute("SELECT * FROM Lms_units WHERE course_id = %s ORDER BY order_num", (course_id,))
        units = cursor.fetchall()
        for unit in units:
            # Chapters for unit
            cursor.execute("SELECT * FROM Lms_chapters WHERE unit_id = %s ORDER BY order_num", (unit['id'],))
            chapters = cursor.fetchall()
            for chap in chapters:
                # Sections
                cursor.execute("SELECT * FROM Lms_chapter_sections WHERE chapter_id = %s ORDER BY order_num", (chap['id'],))
                chap['sections'] = cursor.fetchall()
                # Resources
                cursor.execute("SELECT * FROM Lms_resources WHERE chapter_id = %s", (chap['id'],))
                chap['resources'] = cursor.fetchall()
            unit['chapters'] = chapters
        course['units'] = units
        
        # Direct Chapters (Legacy)
        cursor.execute("SELECT * FROM Lms_chapters WHERE course_id = %s AND unit_id IS NULL ORDER BY order_num", (course_id,))
        course['chapters'] = cursor.fetchall()
        
        # Course level resources
        cursor.execute("SELECT * FROM Lms_resources WHERE course_id = %s AND chapter_id IS NULL", (course_id,))
        course['resources'] = cursor.fetchall()
        
    return course

@router.get("/short-lessons", response_model=List[ShortLessonResponse])
async def get_short_lessons(db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_short_lessons")
        lessons = cursor.fetchall()
        if not lessons:
            default_lessons = [
                ('React.js Full Course', 'Master React.js with this comprehensive guide.', 'React', 'Programming with Mosh', 45000, 1200, 'https://www.youtube.com/watch?v=bMknfKXIFA8', True, 'What is JSX?', 'Javascript XML,Hypertext,Database'),
                ('JavaScript in 1 Hour', 'Learn the fundamentals of JavaScript fast.', 'JavaScript', 'Mosh Hamedani', 32000, 950, 'https://www.youtube.com/watch?v=W6NZfCO5SIk', True, 'How do you declare a variable?', 'let,var,const,All of these'),
                ('Python for Beginners', 'The best way to start your Python journey.', 'Python', 'Mosh', 80000, 3400, 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', True, 'Is Python case-sensitive?', 'Yes,No'),
            ]
            for l in default_lessons:
                cursor.execute("""INSERT INTO Lms_short_lessons (title, description, category, instructor, likes, comments, video_url, has_quiz, quiz_quest, quiz_options) 
                                  VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""", l)
            db.commit()
            cursor.execute("SELECT * FROM Lms_short_lessons")
            lessons = cursor.fetchall()
    return lessons

@router.post("/short-lessons/{id}/interact", response_model=ShortLessonResponse)
async def interact_lesson(id: int, req: InteractRequest, db = Depends(get_db)):
    with db.cursor() as cursor:
        if req.action == "like":
            cursor.execute("UPDATE Lms_short_lessons SET likes = likes + 1 WHERE id = %s", (id,))
        elif req.action == "comment":
            cursor.execute("UPDATE Lms_short_lessons SET comments = comments + 1 WHERE id = %s", (id,))
        db.commit()
        cursor.execute("SELECT * FROM Lms_short_lessons WHERE id = %s", (id,))
        lesson = cursor.fetchone()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.put("/courses/{course_id}", response_model=CourseResponse)
async def update_course(course_id: int, course_data: CourseCreate, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        cursor.execute("SELECT tutor_id FROM Lms_courses WHERE id = %s", (course_id,))
        course = cursor.fetchone()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if course['tutor_id'] != current_user.id and current_user.Lms_role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        cursor.execute("UPDATE Lms_courses SET title = %s, description = %s, category = %s, price = %s, thumbnail = %s WHERE id = %s",
                       (course_data.title, course_data.description, course_data.category, course_data.price, course_data.thumbnail, course_id))
        
        # Clear old nested data
        # Note: Cascade delete should handle this if defined in DB, but we do it manually for raw MySQL safety
        cursor.execute("DELETE FROM Lms_units WHERE course_id = %s", (course_id,))
        cursor.execute("DELETE FROM Lms_chapters WHERE course_id = %s", (course_id,))
        cursor.execute("DELETE FROM Lms_resources WHERE course_id = %s", (course_id,))
        
        # Use same logic as create_course for complexity
        if course_data.units:
            for ui, unit_data in enumerate(course_data.units):
                cursor.execute("INSERT INTO Lms_units (course_id, title, order_num) VALUES (%s, %s, %s)", 
                               (course_id, unit_data.title, unit_data.order_num if unit_data.order_num > 0 else ui + 1))
                unit_id = cursor.lastrowid
                for ci, chap in enumerate(unit_data.chapters):
                    cursor.execute("""INSERT INTO Lms_chapters (course_id, unit_id, title, video_url, description, content_type, order_num, pp_reward) 
                                      VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""", 
                                   (course_id, unit_id, chap.title, chap.video_url, chap.description, chap.content_type, chap.order_num if chap.order_num > 0 else ci + 1, chap.pp_reward or 50))
                    chapter_id = cursor.lastrowid
                    for si, sec in enumerate(chap.sections):
                        cursor.execute("INSERT INTO Lms_chapter_sections (chapter_id, heading, description, order_num) VALUES (%s, %s, %s, %s)",
                                       (chapter_id, sec.heading, sec.description, sec.order_num if sec.order_num > 0 else si + 1))
                    for res in (chap.resources or []):
                        cursor.execute("INSERT INTO Lms_resources (course_id, chapter_id, title, file_type, file_url) VALUES (%s, %s, %s, %s, %s)",
                                       (course_id, chapter_id, res.title, res.file_type, res.file_url))
            for res in (course_data.resources or []):
                cursor.execute("INSERT INTO Lms_resources (course_id, title, file_type, file_url) VALUES (%s, %s, %s, %s)",
                               (course_id, res.title, res.file_type, res.file_url))
        else:
            for i, chap in enumerate(course_data.chapters):
                cursor.execute("INSERT INTO Lms_chapters (course_id, title, video_url, order_num) VALUES (%s, %s, %s, %s)",
                               (course_id, chap.title, chap.video_url, chap.order_num if chap.order_num > 0 else i + 1))
        db.commit()
    return await get_course(course_id, db)

@router.delete("/courses/{course_id}")
async def delete_course(course_id: int, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        cursor.execute("SELECT tutor_id FROM Lms_courses WHERE id = %s", (course_id,))
        course = cursor.fetchone()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if course['tutor_id'] != current_user.id and current_user.Lms_role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        cursor.execute("DELETE FROM Lms_courses WHERE id = %s", (course_id,))
        db.commit()
    return {"status": "success", "message": "Course deleted"}

@router.get("/courses/{course_id}/announcements")
async def get_announcements(course_id: int, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_announcements WHERE course_id = %s ORDER BY timestamp DESC", (course_id,))
        return cursor.fetchall()

@router.post("/courses/{course_id}/announcements")
async def create_announcement(course_id: int, req: AnnouncementCreate, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        cursor.execute("SELECT tutor_id FROM Lms_courses WHERE id = %s", (course_id,))
        course = cursor.fetchone()
        if not course or course['tutor_id'] != current_user.id:
            raise HTTPException(status_code=403, detail="Only the tutor can announce")
        cursor.execute("INSERT INTO Lms_announcements (course_id, content, timestamp) VALUES (%s, %s, %s)", (course_id, req.content, datetime.utcnow()))
        db.commit()
        cursor.execute("SELECT * FROM Lms_announcements WHERE id = %s", (cursor.lastrowid,))
        return cursor.fetchone()

@router.get("/courses/{course_id}/notes")
async def get_notes(course_id: int, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_notes WHERE course_id = %s AND user_id = %s", (course_id, current_user.id))
        return cursor.fetchone()

@router.post("/courses/{course_id}/notes")
async def save_notes(course_id: int, req: NoteCreate, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        cursor.execute("SELECT id FROM Lms_notes WHERE course_id = %s AND user_id = %s", (course_id, current_user.id))
        existing = cursor.fetchone()
        if existing:
            cursor.execute("UPDATE Lms_notes SET content = %s WHERE id = %s", (req.content, existing['id']))
        else:
            cursor.execute("INSERT INTO Lms_notes (user_id, course_id, content) VALUES (%s, %s, %s)", (current_user.id, course_id, req.content))
        db.commit()
    return {"status": "success"}

@router.post("/courses/upload_resource")
async def upload_course_resource(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if current_user.Lms_role not in ["admin", "educator"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    upload_dir = "uploads/resources"
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = "".join([c if c.isalnum() or c in ('.', '_') else '_' for c in file.filename])
    new_filename = f"res_{int(datetime.utcnow().timestamp())}_{safe_name}"
    file_path = os.path.join(upload_dir, new_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"/uploads/resources/{new_filename}"}

@router.post("/courses/upload_thumbnail")
async def upload_course_thumbnail(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if current_user.Lms_role not in ["admin", "educator"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    upload_dir = "uploads/thumbnails"
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = "".join([c if c.isalnum() or c in ('.', '_') else '_' for c in file.filename])
    new_filename = f"thumb_{int(datetime.utcnow().timestamp())}_{safe_name}"
    file_path = os.path.join(upload_dir, new_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"/uploads/thumbnails/{new_filename}"}

@router.get("/courses/{course_id}/personal-resources")
async def get_personal_resources(course_id: int, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_personal_note_files WHERE course_id = %s AND user_id = %s", (course_id, current_user.id))
        return cursor.fetchall()

@router.post("/courses/{course_id}/personal-resources")
async def upload_personal_resource(course_id: int, title: str, file: UploadFile = File(...), db = Depends(get_db), current_user: User = Depends(get_current_user)):
    upload_dir = f"uploads/personal/{current_user.id}"
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = "".join([c if c.isalnum() or c in ('.', '_') else "_" for c in file.filename])
    new_filename = f"note_{int(datetime.utcnow().timestamp())}_{safe_name}"
    file_path = os.path.join(upload_dir, new_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    file_url = f"/uploads/personal/{current_user.id}/{new_filename}"
    with db.cursor() as cursor:
        cursor.execute("INSERT INTO Lms_personal_note_files (user_id, course_id, file_title, file_url) VALUES (%s, %s, %s, %s)", 
                       (current_user.id, course_id, title, file_url))
        db.commit()
        cursor.execute("SELECT * FROM Lms_personal_note_files WHERE id = %s", (cursor.lastrowid,))
        return cursor.fetchone()
