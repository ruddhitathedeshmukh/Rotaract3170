import pymysql
import os
from pathlib import Path
from dotenv import load_dotenv

# Get the project root directory (parent of backend)
project_root = Path(__file__).resolve().parent.parent

# Load environment variables from .env.local in project root
env_path = project_root / '.env.local'
load_dotenv(env_path)

# Database connection parameters
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '3306'))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'rotaract_3170')

try:
    # Connect to MySQL server (without specifying database)
    connection = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD
    )
    
    cursor = connection.cursor()
    
    # Create database if it doesn't exist
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    print(f"✓ Database '{DB_NAME}' created successfully (or already exists)")
    
    # Show all databases
    cursor.execute("SHOW DATABASES")
    databases = cursor.fetchall()
    print("\nAvailable databases:")
    for db in databases:
        print(f"  - {db[0]}")
    
    cursor.close()
    connection.close()
    print(f"\n✓ Successfully connected to MySQL server at {DB_HOST}:{DB_PORT}")
    print(f"✓ You can now access the database '{DB_NAME}' in MySQL Workbench")
    
except pymysql.err.OperationalError as e:
    print(f"✗ Error connecting to MySQL: {e}")
    print("\nPlease ensure:")
    print("  1. MySQL server is running")
    print("  2. The credentials in .env.local are correct")
    print("  3. MySQL is accessible on the specified host and port")
except Exception as e:
    print(f"✗ Unexpected error: {e}")