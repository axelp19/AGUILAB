import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

DB_DRIVER   = os.getenv('DB_DRIVER',   'MariaDB ODBC 3.2 Driver')
DB_HOST     = os.getenv('DB_HOST',     'db-server')
DB_PORT     = os.getenv('DB_PORT',     '3306')
DB_USER     = os.getenv('DB_USER',     'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'rootpassword')
DB_NAME     = os.getenv('DB_NAME',     'aguilab')


def get_connection():
    conn = pyodbc.connect(
        f'DRIVER={{{DB_DRIVER}}};'
        f'SERVER={DB_HOST};'
        f'PORT={DB_PORT};'
        f'DATABASE={DB_NAME};'
        f'USER={DB_USER};'
        f'PASSWORD={DB_PASSWORD};'
        f'OPTION=3;'
        f'CHARSET=UTF8MB4;'
    )
    return conn
