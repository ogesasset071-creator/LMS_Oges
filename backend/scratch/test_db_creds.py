import pymysql
import os

passwords = ["", "root", "Ogesone@123", "password", "Admin@123", "123456", "mysql"]
users = ["root", "oges"]

for user in users:
    for password in passwords:
        try:
            conn = pymysql.connect(
                host='127.0.0.1',
                user=user,
                password=password,
                port=3306,
                autocommit=True
            )
            print(f"SUCCESS: user={user}, password={password if password else '(empty)'}")
            conn.close()
            exit(0)
        except Exception as e:
            print(f"FAILED: user={user}, password={password if password else '(empty)'} - {e}")
