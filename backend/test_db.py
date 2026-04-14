import pymysql
import os
import traceback
from dotenv import load_dotenv

load_dotenv('.env')

try:
  conn = pymysql.connect(
      host=os.getenv('DB_HOST', '127.0.0.1'),
      user=os.getenv('DB_USER', 'root'),
      password=os.getenv('DB_PASSWORD', 'admin'),
      database=os.getenv('DB_NAME', 'OgesLMS'),
      port=int(os.getenv('DB_PORT', '3306'))
  )
  cursor = conn.cursor()
  cursor.execute("SELECT id, Lms_email, Lms_full_name, Lms_xp, Lms_pp, Lms_role, Lms_category FROM Lms_users WHERE Lms_role != 'admin' ORDER BY Lms_xp DESC")
  print(f"Success! {len(cursor.fetchall())} users returned.")
except Exception as e:
  traceback.print_exc()
finally:
  if 'conn' in locals(): conn.close()
