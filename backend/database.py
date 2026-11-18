import sqlite3
import json
import random
import math
from datetime import datetime, timedelta

DB_PATH = "taxi_optimizer.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Create taxis table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS taxis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            driver_name TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            status TEXT DEFAULT 'available',
            total_trips INTEGER DEFAULT 0,
            total_distance REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create trips table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            taxi_id INTEGER,
            pickup_lat REAL NOT NULL,
            pickup_lng REAL NOT NULL,
            pickup_name TEXT,
            dropoff_lat REAL NOT NULL,
            dropoff_lng REAL NOT NULL,
            dropoff_name TEXT,
            distance REAL NOT NULL,
            duration REAL NOT NULL,
            algorithm TEXT NOT NULL,
            route_coords TEXT,
            status TEXT DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (taxi_id) REFERENCES taxis(id)
        )
    ''')

    conn.commit()

    # Check if data already exists
    cursor.execute("SELECT COUNT(*) FROM taxis")
    count = cursor.fetchone()[0]

    if count == 0:
        insert_sample_data(conn)

    conn.close()

def insert_sample_data(conn):
    cursor = conn.cursor()

    # Sample taxis around Delhi, India area
    taxis = [
        ("TX-001", "Rajesh Kumar", 28.6139, 77.2090, "available"),
        ("TX-002", "Amit Singh", 28.6200, 77.2190, "available"),
        ("TX-003", "Priya Sharma", 28.6050, 77.2010, "busy"),
        ("TX-004", "Suresh Patel", 28.6300, 77.2300, "available"),
        ("TX-005", "Meena Devi", 28.6100, 77.2250, "available"),
        ("TX-006", "Vikram Rao", 28.6250, 77.1950, "offline"),
        ("TX-007", "Deepak Joshi", 28.6180, 77.2080, "available"),
        ("TX-008", "Anita Gupta", 28.6080, 77.2150, "busy"),
        ("TX-009", "Ramesh Verma", 28.6220, 77.2020, "available"),
        ("TX-010", "Sunita Yadav", 28.6160, 77.2200, "available"),
    ]

    for taxi in taxis:
        cursor.execute(
            "INSERT INTO taxis (name, driver_name, lat, lng, status, total_trips, total_distance) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (taxi[0], taxi[1], taxi[2], taxi[3], taxi[4],
             random.randint(5, 150), round(random.uniform(50, 2000), 2))
        )

    # Sample trips
    locations = [
        (28.6139, 77.2090, "Connaught Place"),
        (28.6562, 77.2410, "Chandni Chowk"),
        (28.5355, 77.3910, "Noida Sector 18"),
        (28.4595, 77.0266, "Dwarka Sector 21"),
        (28.7041, 77.1025, "Rohini"),
        (28.6692, 77.4538, "Shahdara"),
        (28.5244, 77.1855, "Saket"),
        (28.6448, 77.0945, "Pitampura"),
        (28.5733, 77.3219, "Mayur Vihar"),
        (28.6271, 77.3775, "Laxmi Nagar"),
    ]

    algorithms = ["dijkstra", "astar", "dijkstra", "astar", "dijkstra"]

    for i in range(20):
        pickup = random.choice(locations)
        dropoff = random.choice([l for l in locations if l != pickup])
        algo = random.choice(algorithms)
        dist = round(random.uniform(3, 25), 2)
        dur = round(dist / 30 * 60, 1)  # ~30 km/h avg

        days_ago = random.randint(0, 30)
        created_at = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute(
            '''INSERT INTO trips 
               (taxi_id, pickup_lat, pickup_lng, pickup_name, dropoff_lat, dropoff_lng, dropoff_name,
                distance, duration, algorithm, route_coords, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (random.randint(1, 10), pickup[0], pickup[1], pickup[2],
             dropoff[0], dropoff[1], dropoff[2], dist, dur, algo,
             json.dumps([]), created_at)
        )

    conn.commit()
    print("✅ Database initialized with sample data.")

if __name__ == "__main__":
    init_db()
    print(f"Database created at {DB_PATH}")
