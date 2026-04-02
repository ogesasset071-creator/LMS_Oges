# Models are now simple logic-less objects since the application is moving to raw MySQL.
# SQLAlchemy dependencies have been removed.

class User:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.Lms_full_name = kwargs.get("Lms_full_name")
        self.Lms_email = kwargs.get("Lms_email")
        self.Lms_password_hash = kwargs.get("Lms_password_hash")
        self.Lms_role = kwargs.get("Lms_role", "learner")
        self.Lms_xp = kwargs.get("Lms_xp", 0)
        self.Lms_streak = kwargs.get("Lms_streak", 1)
        self.Lms_total_minutes = kwargs.get("Lms_total_minutes", 0)
        self.Lms_last_login = kwargs.get("Lms_last_login")
        self.Lms_bio = kwargs.get("Lms_bio", "")
        self.Lms_avatar = kwargs.get("Lms_avatar", "https://cdn-icons-png.flaticon.com/512/149/149071.png")
        self.Lms_badges = kwargs.get("Lms_badges", "")
        self.Lms_category = kwargs.get("Lms_category", "")
        self.Lms_pp = kwargs.get("Lms_pp", 0)

class Course:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.tutor_id = kwargs.get("tutor_id")
        self.title = kwargs.get("title")
        self.description = kwargs.get("description")
        self.category = kwargs.get("category")
        self.level = kwargs.get("level", "Beginner")
        self.price = kwargs.get("price", 0.0)
        self.thumbnail = kwargs.get("thumbnail")
        self.video_url = kwargs.get("video_url")
        self.is_approved = kwargs.get("is_approved", False)
        self.required_pp = kwargs.get("required_pp", 200)

class Unit:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.course_id = kwargs.get("course_id")
        self.title = kwargs.get("title")
        self.order_num = kwargs.get("order_num", 1)

class Chapter:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.course_id = kwargs.get("course_id")
        self.unit_id = kwargs.get("unit_id")
        self.title = kwargs.get("title")
        self.video_url = kwargs.get("video_url")
        self.description = kwargs.get("description")
        self.content_type = kwargs.get("content_type", "Video")
        self.order_num = kwargs.get("order_num", 1)
        self.pp_reward = kwargs.get("pp_reward", 50)

class ChapterSection:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.chapter_id = kwargs.get("chapter_id")
        self.heading = kwargs.get("heading")
        self.description = kwargs.get("description")
        self.order_num = kwargs.get("order_num", 1)

class ShortLesson:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.title = kwargs.get("title")
        self.description = kwargs.get("description")
        self.category = kwargs.get("category")
        self.video_url = kwargs.get("video_url")
        self.instructor = kwargs.get("instructor")
        self.likes = kwargs.get("likes", 0)
        self.comments = kwargs.get("comments", 0)
        self.has_quiz = kwargs.get("has_quiz", True)
        self.quiz_quest = kwargs.get("quiz_quest")
        self.quiz_options = kwargs.get("quiz_options")

class Progress:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.user_id = kwargs.get("user_id")
        self.lesson_id = kwargs.get("lesson_id")
        self.completed = kwargs.get("completed", False)
        self.timestamp = kwargs.get("timestamp")

class Resource:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.course_id = kwargs.get("course_id")
        self.chapter_id = kwargs.get("chapter_id")
        self.title = kwargs.get("title")
        self.file_type = kwargs.get("file_type")
        self.file_url = kwargs.get("file_url")
        self.timestamp = kwargs.get("timestamp")

class Note:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.user_id = kwargs.get("user_id")
        self.course_id = kwargs.get("course_id")
        self.content = kwargs.get("content")
        self.timestamp = kwargs.get("timestamp")

class Announcement:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.course_id = kwargs.get("course_id")
        self.content = kwargs.get("content")
        self.timestamp = kwargs.get("timestamp")

class Assignment:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.creator_id = kwargs.get("creator_id")
        self.role = kwargs.get("role")
        self.title = kwargs.get("title")
        self.description = kwargs.get("description")
        self.type = kwargs.get("type", "assignment")
        self.reward_badge = kwargs.get("reward_badge")
        self.category = kwargs.get("category", "General")
        self.level = kwargs.get("level", "Beginner")
        self.pp_reward = kwargs.get("pp_reward", 50)

class AssignmentQuestion:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.assignment_id = kwargs.get("assignment_id")
        self.question_text = kwargs.get("question_text")
        self.options = kwargs.get("options")
        self.correct_options = kwargs.get("correct_options", "0")
        self.question_type = kwargs.get("question_type", "mcq")
        self.correct_answer_text = kwargs.get("correct_answer_text")

class UserAssignment:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.user_id = kwargs.get("user_id")
        self.assignment_id = kwargs.get("assignment_id")
        self.status = kwargs.get("status", "pending")
        self.timestamp = kwargs.get("timestamp")

class PersonalNoteFile:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.user_id = kwargs.get("user_id")
        self.course_id = kwargs.get("course_id")
        self.file_title = kwargs.get("file_title")
        self.file_url = kwargs.get("file_url")
        self.timestamp = kwargs.get("timestamp")
