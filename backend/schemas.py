from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class ResourceBase(BaseModel):
    title: str
    file_type: str # pdf, link, etc.
    file_url: str

class ResourceResponse(ResourceBase):
    id: int
    class Config: from_attributes = True

class ProgressResponse(BaseModel):
    lesson_id: int
    completed: bool
    timestamp: datetime
    class Config: from_attributes = True

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "student"
    category: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str
    email: str
    streak: Optional[int] = 0
    xp: Optional[int] = 0
    pp: Optional[int] = 0
    total_minutes: Optional[int] = 0
    bio: Optional[str] = ""
    avatar: Optional[str] = ""
    category: Optional[str] = ""
    progress: List[ProgressResponse] = []

class ChapterSectionBase(BaseModel):
    heading: str
    description: Optional[str] = ""
    order_num: int = 1

class ChapterSectionResponse(ChapterSectionBase):
    id: int
    class Config: from_attributes = True

class ChapterBase(BaseModel):
    title: str
    video_url: str
    description: Optional[str] = ""
    content_type: Optional[str] = "Video"
    order_num: int = 1
    pp_reward: int = 50
    sections: List[ChapterSectionBase] = []
    resources: List[ResourceBase] = []

class ChapterResponse(ChapterBase):
    id: int
    completed: Optional[bool] = False
    pp_reward: Optional[int] = 50
    sections: List[ChapterSectionResponse] = []
    resources: List[ResourceResponse] = []
    class Config: from_attributes = True

class UnitBase(BaseModel):
    title: str
    order_num: int = 1
    chapters: List[ChapterBase] = []

class UnitResponse(BaseModel):
    id: int
    title: str
    order_num: int = 1
    chapters: List[ChapterResponse] = []
    class Config: from_attributes = True

class CourseResponse(BaseModel):
    id: int
    title: Optional[str] = "Untitled Course"
    description: Optional[str] = ""
    category: Optional[str] = "General"
    level: Optional[str] = "Beginner"
    price: Optional[float] = 0.0
    thumbnail: Optional[str] = None
    tutor_name: Optional[str] = "Premium Educator"
    chapters: List[ChapterResponse] = []
    units: List[UnitResponse] = []
    resources: List[ResourceResponse] = []
    progress_pct: Optional[float] = 0.0
    required_pp: Optional[int] = 200
    class Config: from_attributes = True

class CourseListResponse(BaseModel):
    courses: List[CourseResponse]
    total: int
    page: int
    pages: int

class CourseCreate(BaseModel):
    title: str
    description: str
    category: str
    level: str = "Beginner"
    price: float = 0.0
    thumbnail: Optional[str] = None
    chapters: List[ChapterBase] = []
    units: List[UnitBase] = []
    resources: List[ResourceBase] = []

class ShortLessonResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    video_url: str
    instructor: str
    likes: int
    comments: int
    has_quiz: bool = True
    quiz_quest: str = "Question"
    quiz_options: str = "A,B,C"
    class Config: from_attributes = True
class AssignmentQuestionResponse(BaseModel):
    id: int
    question_text: str
    options: Optional[str] = None
    correct_options: Optional[str] = "0"
    question_type: str = "mcq"
    correct_answer_text: Optional[str] = None
    class Config: from_attributes = True

class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = ""
    type: str = "assignment"
    reward_badge: Optional[str] = ""
    role: Optional[str] = "learner"
    category: Optional[str] = ""
    level: Optional[str] = ""
    pp_reward: Optional[int] = 50
    questions: List[AssignmentQuestionResponse] = []
    class Config: from_attributes = True

class QuestionSchema(BaseModel):
    question: str
    options: Optional[List[str]] = []
    correct_options: Optional[str] = "0" # Comma separated indices e.g. "0,2"
    question_type: str = "mcq"
    correct_answer_text: Optional[str] = ""

class AssignmentCreate(BaseModel):
    title: str
    description: str
    type: str = "assignment"
    reward_badge: Optional[str] = "Professional Badge"
    role: str = "learner"
    category: Optional[str] = "General"
    level: Optional[str] = "Beginner"
    pp_reward: int = 50
    courseId: Optional[int] = None
    questions: Optional[List[QuestionSchema]] = []

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
