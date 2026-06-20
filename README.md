# QA Hiring Assistant

Сервис для автоматизированной оценки QA-кандидатов при найме. Включает онлайн-квиз для кандидатов (Junior / Middle / Senior), HR-дашборд с аналитикой и FastAPI-бэкенд с сохранением результатов в PostgreSQL.

## Демо

- Лендинг и дашборд: [qa-quiz-test.ru](https://qa-quiz-test.ru)
- API: [api.qa-quiz-test.ru](https://api.qa-quiz-test.ru)

## Стек технологий

**Frontend:**
- HTML, CSS, чистый JavaScript (без фреймворков)

**Backend:**
- Python 3.13
- FastAPI
- SQLAlchemy + psycopg
- Uvicorn
- JWT-авторизация (python-jose)

**База данных:**
- PostgreSQL 17

**Тесты:**
- pytest + TestClient FastAPI
- Тестовая БД: in-memory SQLite

## Структура проекта

```text
qa-quiz-web/
├── index.html                 # HR-лендинг
├── CNAME                      # Домен для GitHub Pages
├── quiz/
│   ├── index.html             # Страница квиза для кандидата
│   ├── app.js                 # Логика квиза
│   └── style.css
├── hr-dashboard/
│   └── index.html             # HR-дашборд
├── pricing/
│   └── index.html             # Страница тарифов
├── privacy/
│   └── index.html             # Политика конфиденциальности
├── assets/
│   ├── css/                   # Стили лендинга, дашборда, тарифов
│   └── js/                    # Скрипты лендинга, дашборда, тарифов
├── backend-api/
│   ├── app/
│   │   ├── main.py            # FastAPI endpoints
│   │   ├── models.py          # SQLAlchemy модели
│   │   ├── schemas.py         # Pydantic-схемы
│   │   ├── database.py        # Подключение к БД
│   │   ├── auth.py            # JWT-авторизация и хеширование паролей
│   │   └── data/              # JSON-файлы с вопросами
│   ├── tests/
│   │   ├── conftest.py        # Фикстуры и настройка тестовой БД
│   │   └── test_api.py        # Интеграционные тесты API
│   └── pytest.ini
├── requirements.txt           # Зависимости Python
├── .env.example               # Пример переменных окружения
└── README.md
```

## Установка и запуск

### 1. Виртуальное окружение и зависимости

```bash
cd backend-api
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

```env
# Подключение к PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/qa_quiz

# Секретный ключ для JWT (задайте длинную случайную строку)
SECRET_KEY=your-secret-key-here

# Алгоритм для JWT (по умолчанию HS256)
ALGORITHM=HS256

# Время жизни токена в минутах (по умолчанию 1440 = 24 часа)
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 3. Запуск backend

```bash
cd backend-api
uvicorn app.main:app --reload --port 8000
```

API будет доступен по адресу `http://localhost:8000`.

### 4. Запуск frontend

Frontend — статические HTML-файлы. Откройте корень проекта через Live Server (VS Code) или любой статический сервер:

```bash
# Из корня проекта
python -m http.server 5500
```

Откройте `http://127.0.0.1:5500` в браузере.

> **Важно:** фронт и бэкенд работают на разных портах (5500 и 8000 соответственно). CORS уже настроен для `http://127.0.0.1:5500`.

## Тесты

```bash
cd backend-api
pytest -v
```

Тесты используют in-memory SQLite и не требуют подключения к PostgreSQL.

## Автор

Кирилл Пегашев — QA-инженер и разработчик
Email: [pegashevk4@gmail.com](mailto:pegashevk4@gmail.com)
GitHub: [pegashevk4-rgb](https://github.com/pegashevk4-rgb)
