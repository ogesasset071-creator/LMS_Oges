from fastapi import APIRouter, Depends, HTTPException
from typing import List
from database import get_db
from models import ShortLesson
from auth import get_current_user
from models import User

router = APIRouter(prefix="/short-lessons", tags=["Shorts"])

@router.get("")
async def get_shorts(db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM short_lessons")
        return cursor.fetchall()

@router.post("/{lesson_id}/interact")
async def interact_short(lesson_id: int, interaction: dict, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM short_lessons WHERE id = %s", (lesson_id,))
        short = cursor.fetchone()
        if not short: 
            raise HTTPException(status_code=404, detail="Short lesson not found")
        
        action = interaction.get("action")
        if action == "like":
            cursor.execute("UPDATE short_lessons SET likes = likes + 1 WHERE id = %s", (lesson_id,))
        elif action == "comment":
            cursor.execute("UPDATE short_lessons SET comments = comments + 1 WHERE id = %s", (lesson_id,))
        
        db.commit()
        
        cursor.execute("SELECT likes, comments FROM short_lessons WHERE id = %s", (lesson_id,))
        updated = cursor.fetchone()
        
    return {"status": "success", "likes": updated['likes'], "comments": updated['comments']}
