import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging for mail
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MailService")

def get_smtp_config():
    return {
        "server": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        "port": int(os.getenv("SMTP_PORT", 587)),
        "user": os.getenv("SMTP_USER", ""),
        "pass": os.getenv("SMTP_PASS", ""),
        "from": os.getenv("FROM_EMAIL", "notifications@oges.co")
    }

def wrap_template(content: str):
    return f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
             <img src="cid:logo" alt="Company Logo" style="width: 140px; height: auto;">
        </div>
        <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
            {content}
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            &copy; {datetime.now().year} OgesLMS Platform. All rights reserved.
        </div>
    </div>
    """

def send_email(to_email: str, subject: str, content: str):
    config = get_smtp_config()
    
    if not config["user"] or not config["pass"]:
        logger.info(f"--- SIMULATED EMAIL (No Credentials) ---")
        # Still log to files for visibility
        with open("mail_log.txt", "a") as f:
            f.write(f"[{datetime.now()}] To: {to_email} | Subject: {subject}\n")
            f.write(f"Content: {content}\n")
            f.write("-" * 50 + "\n")
        return True

    try:
        msg = MIMEMultipart('related')
        msg['From'] = config["from"]
        msg['To'] = to_email
        msg['Subject'] = subject

        msg_body = MIMEMultipart('alternative')
        msg.attach(msg_body)
        
        html_content = wrap_template(content)
        msg_body.attach(MIMEText(html_content, 'html'))

        # Attach Logo CID
        # Path to the logo in the frontend assets
        logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "assets", "Compaylogo.png"))
        if os.path.exists(logo_path):
            with open(logo_path, "rb") as f:
                img = MIMEImage(f.read())
                img.add_header('Content-ID', '<logo>')
                msg.attach(img)
        else:
            # Fallback path just in case, pointing to root uploads
            fallback_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "logo.png"))
            if os.path.exists(fallback_path):
                with open(fallback_path, "rb") as f:
                    img = MIMEImage(f.read())
                    img.add_header('Content-ID', '<logo>')
                    msg.attach(img)

        server = smtplib.SMTP(config["server"], config["port"])
        server.starttls()
        server.login(config["user"], config["pass"])
        server.send_message(msg)
        server.quit()
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False

# --- Notification Templates ---

def notify_welcome(user_email: str, user_name: str):
    subject = "Welcome to OgesLMS - Your Learning Journey Begins!"
    body = f"""
    <h1>Welcome to OgesLMS, {user_name}!</h1>
    <p>We are thrilled to have you onboard. Your account has been successfully created.</p>
    <p>Explore our tracks in Frontend, Backend, and Full Stack development to start your career.</p>
    <br/>
    <p>Best regards,<br/>The OgesLMS Team</p>
    """
    send_email(user_email, subject, body)

def notify_login(user_email: str):
    subject = "Security Alert: New Login to OgesLMS"
    body = f"""
    <p>Hello,</p>
    <p>A new login was detected for your account at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}.</p>
    <p>If this wasn't you, please secure your account immediately.</p>
    """
    send_email(user_email, subject, body)

def notify_new_course(user_email: str, course_title: str):
    subject = f"New Course Alert: {course_title}"
    body = f"""
    <h1>New Content Available!</h1>
    <p>A new course "<strong>{course_title}</strong>" has been added to our catalog.</p>
    <p>Dive in and start learning today!</p>
    """
    send_email(user_email, subject, body)

def notify_course_started(user_email: str, course_title: str):
    subject = f"Let's Go! You started {course_title}"
    body = f"""
    <p>Excellent choice!</p>
    <p>You've officially started learning <strong>{course_title}</strong>.</p>
    <p>Keep up the momentum and reach your goals.</p>
    """
    send_email(user_email, subject, body)

def notify_new_assignment(user_email: str, assignment_title: str):
    subject = f"New Challenge: {assignment_title}"
    body = f"""
    <p>A new assignment "<strong>{assignment_title}</strong>" has been assigned to you.</p>
    <p>Complete it to earn PP points and level up!</p>
    """
    send_email(user_email, subject, body)

def notify_new_quiz(user_email: str, quiz_title: str):
    subject = f"Interactive Quiz: {quiz_title}"
    body = f"""
    <p>Challenge yourself! A new quiz "<strong>{quiz_title}</strong>" is now available.</p>
    <p>Test your knowledge and earn rewards.</p>
    """
    send_email(user_email, subject, body)

def notify_assignment_completed(user_email: str, assignment_title: str):
    subject = f"Assignment Completed: {assignment_title} ✅"
    body = f"""
    <h1>Great Job!</h1>
    <p>You have successfully submitted your assignment "<strong>{assignment_title}</strong>".</p>
    <p>Your performance has been recorded and reward points have been added to your profile.</p>
    """
    send_email(user_email, subject, body)

def notify_quiz_completed(user_email: str, quiz_title: str):
    subject = f"Quiz Master: {quiz_title} 🏆"
    body = f"""
    <h1>Quiz Completed!</h1>
    <p>Congratulations on finishing "<strong>{quiz_title}</strong>"! 🎯</p>
    <p>Check your leaderboard rank to see where you stand.</p>
    """
    send_email(user_email, subject, body)

def notify_student_completion_to_admin(admin_email: str, student_name: str, course_title: str):
    subject = f"Progress Alert: {student_name} finished {course_title}"
    body = f"""
    <h3>Great news for your module!</h3>
    <p>A student "<strong>{student_name}</strong>" has successfully completed your training "<strong>{course_title}</strong>".</p>
    <p>You can view their performance and certification details in your dashboad.</p>
    """
    send_email(admin_email, subject, body)

def notify_course_completed(user_email: str, course_title: str):
    subject = f"Congratulations! You finished {course_title} 🎉"
    body = f"""
    <h1>Mission Accomplished!</h1>
    <p>Well done! You have successfully completed "<strong>{course_title}</strong>".</p>
    <p>Your dedication is inspiring. Check your profile for your new badge and XP rewards.</p>
    <br/>
    <p>Keep learning,<br/>The OgesLMS Team</p>
    """
    send_email(user_email, subject, body)
    return True

def notify_password_reset(user_email: str, token: str):
    subject = "Password Reset Request - OgesLMS"
    reset_url = f"http://localhost:5173/reset-password?token={token}"
    body = f"""
    <h3>Forgot your password?</h3>
    <p>We received a request to reset the password for your OgesLMS account.</p>
    <p>Please click the button below to set a new password. This link will expire in 15 minutes.</p>
    <div style="margin: 30px 0;">
        <a href="{reset_url}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    <p>If you did not request this, you can safely ignore this email.</p>
    """
    send_email(user_email, subject, body)
    return True
