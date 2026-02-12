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
    # Connect to MySQL database
    connection = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    
    cursor = connection.cursor()
    
    print("=" * 70)
    print(f"✓ Successfully connected to MySQL database: {DB_NAME}")
    print("=" * 70)
    
    # Show all tables
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    print(f"\n📊 Total Tables Created: {len(tables)}")
    print("-" * 70)
    
    for i, table in enumerate(tables, 1):
        table_name = table[0]
        print(f"\n{i}. Table: {table_name}")
        
        # Get table structure
        cursor.execute(f"DESCRIBE {table_name}")
        columns = cursor.fetchall()
        
        print(f"   Columns ({len(columns)}):")
        for col in columns:
            field, type_, null, key, default, extra = col
            key_info = f" [{key}]" if key else ""
            print(f"      - {field}: {type_}{key_info}")
        
        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"   Records: {count}")
    
    print("\n" + "=" * 70)
    print("✓ Database verification complete!")
    print("=" * 70)
    
    print("\n📝 Instructions to view in MySQL Workbench:")
    print("-" * 70)
    print(f"1. Open MySQL Workbench")
    print(f"2. Connect to: {DB_HOST}:{DB_PORT}")
    print(f"3. Username: {DB_USER}")
    print(f"4. Select database: {DB_NAME}")
    print(f"5. You should see {len(tables)} tables in the left sidebar")
    print("-" * 70)
    
    cursor.close()
    connection.close()
    
except pymysql.err.OperationalError as e:
    print(f"✗ Error connecting to MySQL: {e}")
    print("\nPlease ensure:")
    print("  1. MySQL server is running")
    print("  2. The credentials in .env.local are correct")
    print("  3. MySQL is accessible on the specified host and port")
except Exception as e:
    print(f"✗ Unexpected error: {e}")