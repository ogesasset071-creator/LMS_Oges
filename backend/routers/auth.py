from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from datetime import datetime
from database import get_db
from models import User
from schemas import UserCreate, LoginRequest, Token, ForgotPasswordRequest, ResetPasswordRequest
from auth import hash_password, verify_password, create_access_token, create_reset_token, verify_token
from mail_utils import notify_welcome, notify_login, notify_password_reset

router = APIRouter(tags=["Authentication"])

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_users WHERE Lms_email = %s", (req.Lms_email,))
        user_data = cursor.fetchone()
    
    if not user_data:
        # Don't reveal if email doesn't exist for security
        return {"message": "If this email is registered, you will receive a reset link shortly."}
    
    token = create_reset_token(user_data['Lms_email'])
    background_tasks.add_task(notify_password_reset, user_data['Lms_email'], token)
    return {"message": "If this email is registered, you will receive a reset link shortly."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db = Depends(get_db)):
    payload = verify_token(req.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    email = payload.get("sub")
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_users WHERE Lms_email = %s", (email,))
        user_data = cursor.fetchone()
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    hashed_password = hash_password(req.new_password)
    with db.cursor() as cursor:
        cursor.execute("UPDATE Lms_users SET Lms_password_hash = %s WHERE Lms_email = %s", (hashed_password, email))
    
    return {"message": "Password updated successfully"}

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate, background_tasks: BackgroundTasks, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_users WHERE Lms_email = %s", (user.Lms_email,))
        db_user = cursor.fetchone()
    
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    if not user.Lms_email.endswith("@oges.co") and not user.Lms_email.endswith("@ogesone.com"):
        # Added ogesone.com for testing if needed
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only @oges.co emails are allowed for signup")
    
    if not user.password:
        raise HTTPException(status_code=400, detail="Password cannot be empty")
    
    try:
        hashed_password = hash_password(user.password)
    except Exception as e:
        print(f"HASHING ERROR: {e}")
        raise HTTPException(status_code=500, detail="Error processing password")

    try:
        with db.cursor() as cursor:
            sql = """INSERT INTO Lms_users (Lms_full_name, Lms_email, Lms_password_hash, Lms_role, Lms_category, Lms_streak, Lms_xp, Lms_total_minutes) 
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (user.Lms_full_name, user.Lms_email, hashed_password, user.Lms_role, user.Lms_category, 1, 0, 0))
            db.commit()
        
        print(f"SUCCESS: User {user.Lms_email} saved to database.")
        background_tasks.add_task(notify_welcome, user.Lms_email, user.Lms_full_name)
        
    except Exception as e:
        print(f"DATABASE ERROR: Failed to save user {user.Lms_email}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Could not save user to database: {str(e)}")
    
    token = create_access_token({"sub": user.Lms_email, "role": user.Lms_role})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "Lms_role": user.Lms_role, 
        "Lms_full_name": user.Lms_full_name,
        "Lms_email": user.Lms_email,
        "Lms_streak": 1,
        "Lms_xp": 0,
        "Lms_total_minutes": 0,
        "Lms_bio": "",
        "Lms_avatar": "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        "Lms_category": user.Lms_category or "",
        "progress": []
    }


@router.post("/login", response_model=Token)
def login(req: LoginRequest, background_tasks: BackgroundTasks, db = Depends(get_db)):
    print(f"DEBUG: Attempting Local Login for {req.Lms_email}")
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM Lms_users WHERE Lms_email = %s", (req.Lms_email,))
            user = cursor.fetchone()
            
        if not user or not verify_password(req.password, user['Lms_password_hash']):
            print(f"DEBUG: LOGIN FAILED: {req.Lms_email}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        streak = user.get('Lms_streak') or 1
        xp = user.get('Lms_xp') or 0
        total_minutes = user.get('Lms_total_minutes') or 0
        now = datetime.utcnow()
        
        last_login_dt = user.get('Lms_last_login')
        if last_login_dt:
            if isinstance(last_login_dt, str):
                from dateutil import parser
                last_login_dt = parser.parse(last_login_dt)
            
            days_diff = (now.date() - last_login_dt.date()).days
            if days_diff == 1:
                streak += 1
            elif days_diff > 1:
                streak = 1
        else:
            streak = 1

        with db.cursor() as cursor:
            cursor.execute("UPDATE Lms_users SET Lms_streak = %s, Lms_last_login = %s WHERE id = %s", (streak, now, user['id']))
        
        background_tasks.add_task(notify_login, user['Lms_email'])
        
        token = create_access_token({"sub": user['Lms_email'], "role": user['Lms_role']})
        return {
            "access_token": token, 
            "token_type": "bearer", 
            "Lms_role": user['Lms_role'], 
            "Lms_full_name": user['Lms_full_name'],
            "Lms_email": user['Lms_email'],
            "Lms_streak": streak,
            "Lms_xp": xp,
            "Lms_total_minutes": total_minutes,
            "Lms_bio": user.get('Lms_bio') or "",
            "Lms_avatar": user.get('Lms_avatar') or "",
            "Lms_category": user.get('Lms_category') or "",
            "Lms_pp": user.get('Lms_pp') or 0,
            "progress": []
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"LOGIN EXCEPTION: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
