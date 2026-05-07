from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
import pytz
import gspread
from google.oauth2.service_account import Credentials
import os
from dotenv import load_dotenv
import json
import random

# Загрузить переменные окружения из .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# Настройки Google Sheets (из переменных окружения)
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SERVICE_ACCOUNT_FILE = os.getenv('SERVICE_ACCOUNT_FILE')
SPREADSHEET_ID = os.getenv('SPREADSHEET_ID')

# Проверка наличия переменных
if not SERVICE_ACCOUNT_FILE or not SPREADSHEET_ID:
    raise ValueError("⚠️ Ошибка: установите SERVICE_ACCOUNT_FILE и SPREADSHEET_ID в файле .env")

# === ЗАГРУЗКА ВОПРОСОВ ПО УРОВНЯМ ===
with open('questions_junior.json', 'r', encoding='utf-8') as f:
    QUESTIONS_JUNIOR = json.load(f)

with open('questions_middle.json', 'r', encoding='utf-8') as f:
    QUESTIONS_MIDDLE = json.load(f)

with open('questions_senior.json', 'r', encoding='utf-8') as f:
    QUESTIONS_SENIOR = json.load(f)

# КОНФИГ ТЕСТОВ (3 разных ссылки)
TESTS_CONFIG = {
    "qa_junior_web": {
        "title": "QA Junior Web",
        "questions": QUESTIONS_JUNIOR,
        "num_questions": 30  # можешь поменять
    },
    "qa_middle_web": {
        "title": "QA Middle Web",
        "questions": QUESTIONS_MIDDLE,
        "num_questions": 30
    },
    "qa_senior_web": {
        "title": "QA Senior Web",
        "questions": QUESTIONS_SENIOR,
        "num_questions": 30
    },
}


def init_db():
    conn = sqlite3.connect('quiz_results.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT,
            score INTEGER,
            total_questions INTEGER,
            percentage REAL,
            date_completed TEXT,
            test_id TEXT
        )
    ''')
    conn.commit()
    conn.close()


def save_to_google_sheets(data_row):
    """Сохранение в Google Sheets через API"""
    try:
        creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        client = gspread.authorize(creds)
        sheet = client.open_by_key(SPREADSHEET_ID).sheet1
        sheet.append_row(data_row)
        print(f"✅ Данные отправлены в Google Sheets: {data_row}")
    except Exception as e:
        print(f"❌ Ошибка отправки в Google Sheets: {e}")


# === ОТДАТЬ ВОПРОСЫ ПО test_id ===
@app.route('/api/test/<test_id>', methods=['GET'])
def get_test(test_id):
    config = TESTS_CONFIG.get(test_id)
    if not config:
        return jsonify({"error": "Unknown test_id"}), 404

    questions = config["questions"][:]
    random.shuffle(questions)
    questions = questions[:config["num_questions"]]

    return jsonify({
        "test_id": test_id,
        "title": config["title"],
        "questions": questions
    })


@app.route('/api/save-result', methods=['POST'])
def save_result():
    data = request.json

    conn = sqlite3.connect('quiz_results.db')
    cursor = conn.cursor()

    percentage = (data['score'] / data['total']) * 100

    # Московское время
    msk_tz = pytz.timezone('Europe/Moscow')
    current_time = datetime.now(msk_tz).strftime('%Y-%m-%d %H:%M:%S')

    cursor.execute('''
        INSERT INTO results (
            first_name, last_name, email,
            score, total_questions, percentage,
            date_completed, test_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['firstName'],
        data['lastName'],
        data['email'],
        data['score'],
        data['total'],
        percentage,
        current_time,
        data.get('testId')  # важное новое поле
    ))

    result_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Отправка в Google Sheets
    data_row = [
        result_id,
        data['firstName'],
        data['lastName'],
        data['email'],
        data['score'],
        data['total'],
        round(percentage, 1),
        current_time,
        data.get('testId')
    ]
    save_to_google_sheets(data_row)

    return jsonify({'status': 'success', 'percentage': percentage})


@app.route('/api/results', methods=['GET'])
def get_results():
    conn = sqlite3.connect('quiz_results.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM results ORDER BY date_completed DESC')
    results = cursor.fetchall()
    conn.close()

    return jsonify(results)


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
