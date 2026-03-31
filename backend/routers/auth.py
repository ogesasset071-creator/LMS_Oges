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
        cursor.execute("SELECT * FROM users WHERE email = %s", (req.email,))
        user_data = cursor.fetchone()
    
    if not user_data:
        # Don't reveal if email doesn't exist for security
        return {"message": "If this email is registered, you will receive a reset link shortly."}
    
    token = create_reset_token(user_data['email'])
    background_tasks.add_task(notify_password_reset, user_data['email'], token)
    return {"message": "If this email is registered, you will receive a reset link shortly."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db = Depends(get_db)):
    payload = verify_token(req.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    email = payload.get("sub")
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user_data = cursor.fetchone()
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    hashed_password = hash_password(req.new_password)
    with db.cursor() as cursor:
        cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (hashed_password, email))
    
    return {"message": "Password updated successfully"}

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate, background_tasks: BackgroundTasks, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        db_user = cursor.fetchone()
    
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    if not user.email.endswith("@oges.co") and not user.email.endswith("@ogesone.com"):
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
            sql = """INSERT INTO users (full_name, email, password_hash, role, category, streak, xp, total_minutes) 
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (user.full_name, user.email, hashed_password, user.role, user.category, 1, 0, 0))
            db.commit()
        
        print(f"SUCCESS: User {user.email} saved to database.")
        background_tasks.add_task(notify_welcome, user.email, user.full_name)
        
    except Exception as e:
        print(f"DATABASE ERROR: Failed to save user {user.email}: {e}")
        raise HTTPException(status_code=500, detail="Could not save user to database")
    
    token = create_access_token({"sub": user.email, "role": user.role})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "role": user.role, 
        "full_name": user.full_name,
        "email": user.email,
        "streak": 1,
        "xp": 0,
        "total_minutes": 0,
        "bio": "",
        "avatar": "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        "category": user.category or "",
        "progress": []
    }

@router.post("/login", response_model=Token)
async def login(req: LoginRequest, background_tasks: BackgroundTasks, db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (req.email,))
            user = cursor.fetchone()
            
        if not user or not verify_password(req.password, user['password_hash']):
            print(f"LOGIN FAILED: {req.email}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        streak = user.get('streak') or 1
        xp = user.get('xp') or 0
        total_minutes = user.get('total_minutes') or 0
        now = datetime.utcnow()
        
        last_login_dt = user.get('last_login')
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
            cursor.execute("UPDATE users SET streak = %s, last_login = %s WHERE id = %s", (streak, now, user['id']))
        
        background_tasks.add_task(notify_login, user['email'])
        
        token = create_access_token({"sub": user['email'], "role": user['role']})
        return {
            "access_token": token, 
            "token_type": "bearer", 
            "role": user['role'], 
            "full_name": user['full_name'],
            "email": user['email'],
            "streak": streak,
            "xp": xp,
            "total_minutes": total_minutes,
            "bio": user.get('bio') or "",
            "avatar": user.get('avatar') or "",
            "category": user.get('category') or "",
            "pp": user.get('pp') or 0,
            "progress": [] # Needs a separate join/query if needed
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"LOGIN EXCEPTION: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
