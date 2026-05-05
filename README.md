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
git clone https://github.com/ваш-username/qa-quiz-web.git
cd qa-quiz-web
```

2. Создать виртуальное окружение:
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
```

3. Установить зависимости:
```bash
pip install -r requirements.txt
```

4. Настроить Google Sheets API:
   - Создать проект в Google Cloud Console
   - Включить Google Sheets API
   - Создать сервисный аккаунт и скачать JSON-ключ
   - Поместить JSON-ключ в корень проекта
   - Добавить email сервисного аккаунта в настройки доступа Google Таблицы

5. Обновить `server.py`:
   - Указать имя JSON-файла в `SERVICE_ACCOUNT_FILE`
   - Указать ID вашей Google Таблицы в `SPREADSHEET_ID`

## Запуск

```bash
python server.py
```

Открыть в браузере: `http://localhost:5000`

## Структура проекта
qa-quiz-web/
├── index.html # Главная страница
├── script.js # Логика квиза
├── styles.css # Стили
├── server.py # Flask сервер
├── requirements.txt # Зависимости Python
├── .gitignore # Исключения для Git
└── README.md # Документация

text

## Автор

Кирилл Пегашев - Junior Python Developer / QA Engineer
