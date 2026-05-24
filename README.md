## QA Quiz Web

QA Quiz Web — это SaaS‑сервис для быстрой оценки QA‑кандидатов.  
Сервис включает три компонента:  
- онлайн‑квиз для кандидатов,  
- HR‑лендинг и дашборд для рекрутеров,  
- бэкенд‑API с сохранением результатов в PostgreSQL.

## Демо

**Frontend (GitHub Pages):**
- Junior: https://pegashevk4-rgb.github.io/qa-quiz-web/index.html?test_id=qa_junior_web  
- Middle: https://pegashevk4-rgb.github.io/qa-quiz-web/index.html?test_id=qa_middle_web  
- Senior: https://pegashevk4-rgb.github.io/qa-quiz-web/index.html?test_id=qa_senior_web

**Backend API (Vercel):**
- API URL: https://qa-quiz-web.vercel.app

## HR Landing & Dashboard (новый модуль)

**HR Landing (для рекрутеров / тимлидов / фаундеров):**
- Демо: https://pegashevk4-rgb.github.io/qa-quiz-web/hr.html
- Описание сервиса для быстрой оценки QA-кандидатов
- Примеры интерфейсов, объяснение ценности и сценариев использования

  В дальнейшем HR Dashboard будет подключён к реальной БД и снабжён авторизацией (логин HR → переход на /hr-dashboard).

**HR Dashboard (прототип):**
- Отдельный HTML (hr-dashboard.html)
- Таблица кандидатов с фильтрацией, сортировкой, поиском
- Модальное окно с детальными результатами по темам (SQL, API, теория тестирования и т.д.)
- Переключение светлой / тёмной темы

## Возможности

### Тестирование
- Три уровня сложности: Junior / Middle / Senior
- До 30 случайных вопросов за попытку (настраивается через QUESTIONS_PER_RUN в app.js)
- Поддержка вопросов с одним и несколькими правильными вариантами
- Таймер прохождения, зависящий от уровня сложности
- Автоматический расчёт результатов по категориям (SQL, API, Testing theory и т.д.)
- Выделение сильных и слабых зон кандидата

### Сохранение результатов
- ✅ Автоматическое сохранение результатов в облачную БД PostgreSQL (Neon)
- ✅ Сбор данных: имя, фамилия, email, результаты по категориям
- ✅ Детализация: общий балл, процент, вердикт, сильные/слабые стороны
- 🔄 Админ-панель для HR (в разработке)

### UX
- Интерфейс на русском языке
- Защита от копирования текста квиза
- Адаптивный дизайн

## Архитектура
Frontend (GitHub Pages)
↓
Backend API (Vercel, FastAPI)
↓
PostgreSQL Database (Neon, Frankfurt)

## Технологии

**Frontend:**
- HTML, CSS, чистый JavaScript
- Хостинг: GitHub Pages

**Backend:**
- Python 3.10+
- FastAPI (веб-фреймворк)
- SQLAlchemy (ORM для работы с БД)
- Uvicorn (ASGI сервер)
- Хостинг: Vercel (бесплатно, 24/7)

**База данных:**
- PostgreSQL 17
- Хостинг: Neon.tech (бесплатно, регион Frankfurt)
- Таблицы: `users`, `results`, `detailed_results`

## Структура проекта

```text
qa-quiz-web/
├── index.html              # Главная страница квиза
├── app.js                  # Логика квиза (frontend)
├── style.css               # Стили
├── questions/              # JSON-файлы с вопросами по уровням
│   ├── qa_junior_web.json
│   ├── qa_middle_web.json
│   └── qa_senior_web.json
└── backend/                # Backend API
    ├── api/
    │   └── index.py        # FastAPI endpoints
    ├── requirements.txt    # Python зависимости
    └── vercel.json         # Конфигурация для деплоя
```

## Локальный запуск

### Frontend
```bash
# Простой способ
python -m http.server 8000
# Откройте http://localhost:8000

### Backend (для разработки)
```bash
cd backend

# Создайте виртуальное окружение
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Установите зависимости
pip install -r requirements.txt

# Добавьте переменную окружения DATABASE_URL
# (строку подключения к PostgreSQL)

# Запустите сервер
uvicorn api.index:app --reload --port 8000
```

## База данных

### Схема таблиц

**users** - информация о кандидатах
- `id` (SERIAL PRIMARY KEY)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `created_at` (TIMESTAMP)

**results** - общие результаты тестов
- `id` (SERIAL PRIMARY KEY)
- `user_id` (FK → users)
- `test_id` (VARCHAR) - уровень теста
- `total_score` (DECIMAL)
- `max_score` (DECIMAL)
- `percent` (INTEGER)
- `verdict` (VARCHAR)
- `created_at` (TIMESTAMP)

**detailed_results** - результаты по категориям
- `id` (SERIAL PRIMARY KEY)
- `result_id` (FK → results)
- `category` (VARCHAR)
- `percent` (INTEGER)
- `is_strong` (BOOLEAN)
- `is_weak` (BOOLEAN)

## API Endpoints

- `GET /` - проверка работы API
- `POST /api/results` - сохранение результатов теста

## Планы развития

- [ ] Подключить HR Dashboard к реальной БД (кандидаты / результаты)
- [ ] Авторизация для HR (логин → переход на /hr-dashboard)
- [ ] Хеширование паролей (bcrypt/argon2) и безопасное хранение пользователей
- [ ] Скрытие текста вопросов (проверка ответов на сервере)

## Деплой

**Frontend:** автоматически деплоится на GitHub Pages при push в `main`  
**Backend:** автоматически деплоится на Vercel при push в `main`  
**База данных:** хостится на Neon.tech (регион Frankfurt)

## Лицензия

MIT

## Автор

Кирилл Пегашев — QA-инженер и разработчик
Email: pegashevk4@gmail.com
GitHub: @pegashevk4-rgb
создатель QA Quiz Web и QA Hiring Assistant.
