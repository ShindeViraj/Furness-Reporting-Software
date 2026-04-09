from flask import Flask, render_template, request, jsonify
import mysql.connector

app = Flask(__name__)

# Database configuration
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'Abc', 
    'password': 'Satara@321', 
    'database': 'furness'
}

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def format_datetime(rows):
    # SPEED OPTIMIZATION: str() is significantly faster than strftime() for thousands of rows
    for row in rows:
        if row.get('log_time'):
            row['log_time'] = str(row['log_time'])
    return rows

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/latest_cycle', methods=['GET'])
def get_latest_cycle():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Find the ID of the absolute latest COMPLETED cycle
    cursor.execute("SELECT MAX(id) as last_id FROM heater_pv_log WHERE Cycle_end = 1")
    last_end_row = cursor.fetchone()
    last_end = last_end_row['last_id'] if last_end_row else None
    
    if not last_end:
        # If no cycle has ever ended, fetch everything except the end markers
        cursor.execute("SELECT * FROM heater_pv_log WHERE Cycle_end = 0 ORDER BY id ASC")
        rows = cursor.fetchall()
    else:
        # 2. Find the end of the cycle right before it to act as the starting boundary
        cursor.execute("SELECT id FROM heater_pv_log WHERE Cycle_end = 1 AND id < %s ORDER BY id DESC LIMIT 1", (last_end,))
        prev_end_row = cursor.fetchone()
        prev_end = prev_end_row['id'] if prev_end_row else 0
        
        # 3. STRICTLY fetch the last completed cycle, but explicitly EXCLUDE the final row where Cycle_end = 1
        cursor.execute("SELECT * FROM heater_pv_log WHERE id >= %s AND id < %s ORDER BY id ASC", (prev_end, last_end))
        rows = cursor.fetchall()
        
    cursor.close()
    conn.close()
    
    return jsonify(format_datetime(rows))

@app.route('/api/date_range', methods=['POST'])
def get_date_range():
    data = request.json
    start_date = data.get('start')
    end_date = data.get('end')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = "SELECT * FROM heater_pv_log WHERE log_time >= %s AND log_time <= %s ORDER BY log_time ASC"
    cursor.execute(query, (start_date + " 00:00:00", end_date + " 23:59:59"))
    rows = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(format_datetime(rows))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
