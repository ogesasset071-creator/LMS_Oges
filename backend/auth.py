from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from database import get_db
# from models import User - Removed SQLAlchemy dependency
import os

# --- AUTH CONFIG ---
SECRET_KEY = os.getenv("SECRET_KEY", "LMSSecretKeySuperSecure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # 24 Hours

from passlib.context import CryptContext

# --- Hashing Helper ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Returns password as-is (plaintext) as requested."""
    return password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Performs a simple string comparison for plaintext passwords."""
    return plain_password == hashed_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_reset_token(email: str):
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"sub": email, "exp": expire, "type": "reset"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    """
    Retrieves the user from the database using raw MySQL query.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM Lms_users WHERE Lms_email = %s", (email,))
        user = cursor.fetchone()
        
    if not user:
        raise credentials_exception
    
    # Return as a simple object or dict (routers expect objects with .attribute access)
    # We can use our simple User model from models.py or just a Munch/DotDict-like behavior.
    # Our models.py User class works fine with dict unpacking.
    from models import User
    return User(**user)
