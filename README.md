# QA Quiz Web Application

Веб-приложение для тестирования знаний по QA с автоматическим сохранением результатов в Google Sheets.

## Особенности

- 30 вопросов по тестированию ПО
- Автоматическое сохранение результатов в Google Таблицы
- Локальная база данных SQLite
- Поддержка кириллицы
- Flask backend + Vanilla JS frontend

## Технологии

- **Backend:** Python, Flask, SQLite
- **Frontend:** HTML, CSS, JavaScript
- **Интеграция:** Google Sheets API, gspread
- **Деплой:** GitHub Pages (frontend)

## Установка

1. Клонировать репозиторий:
```bash
git clone https://github.com/pegashevk4-rgb/qa-quiz-web.git
cd qa-quiz-web
```

2. Создать виртуальное окружение:
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
# или
source .venv/bin/activate  # Linux/Mac
```

3. Установить зависимости:
```bash
pip install -r requirements.txt
```

4. Создать файл `.env` (на основе `.env.example`):
```bash
cp .env.example .env
```

Заполнить `.env` своими данными:
- `SERVICE_ACCOUNT_FILE` — имя JSON-файла с ключом Google API
- `SPREADSHEET_ID` — ID вашей Google Таблицы (из URL)

5. Настроить Google Sheets API:
   - Создать проект в [Google Cloud Console](https://console.cloud.google.com)
   - Включить Google Sheets API
   - Создать сервисный аккаунт и скачать JSON-ключ
   - Поместить JSON-ключ в корень проекта
   - Добавить email сервисного аккаунта (`...@....iam.gserviceaccount.com`) в настройки доступа Google Таблицы как **Редактор**


## Запуск

```bash
python server.py
```

Открыть в браузере: `http://localhost:5000`

## Структура проекта
qa-quiz-web/
├── index.html # Главная страница
├── app.js # Логика квиза
├── style.css # Стили
├── server.py # Flask сервер
├── questions.json # База вопросов
├── requirements.txt # Зависимости Python
├── .env.example # Шаблон переменных окружения
├── .gitignore # Исключения для Git
└── README.md # Документация

text

## Автор

Кирилл Пегашев - Junior Python Developer / QA Engineer
