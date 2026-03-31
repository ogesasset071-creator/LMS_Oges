import os
import pymysql
from dotenv import load_dotenv

# Load env from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

# MySQL Database Connection configuration
# DB_USER = os.getenv("DB_USER", "oges")
# DB_PASSWORD = os.getenv("DB_PASSWORD", "Ogesone@123")
# DB_HOST = os.getenv("DB_HOST", "192.168.1.161")
# DB_PORT = os.getenv("DB_PORT", "3306")
# DB_NAME = os.getenv("DB_NAME", "oges_asset")

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "admin")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "OgesLMS")


def get_db():
    """
    Dependency to get a MySQL database connection.
    Uses pymysql to connect to the database.
    """
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=int(DB_PORT),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        yield connection
    except Exception as e:
        print(f"DATABASE CONNECTION ERROR: {e}")
        raise
    finally:
        if 'connection' in locals():
            connection.close()

def execute_query(query, params=None):
    """
    Helper function to execute a query and return results.
    """
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=int(DB_PORT),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params or ())
            return cursor.fetchall()
    finally:
        connection.close()
