# QA Quiz Web

QA Quiz Web — pet‑проект для оценки QA‑кандидатов при найме.

Сервис включает:
- онлайн‑квиз для кандидатов (Junior / Middle / Senior);
- HR‑лендинг и дашборд для рекрутеров;
- бэкенд API с сохранением результатов в PostgreSQL.

## Демо

- Лендинг: [qa-quiz-test.ru](https://qa-quiz-test.ru)
- API: [api.qa-quiz-test.ru](https://api.qa-quiz-test.ru)

## Что реализовано

- тесты для уровней Junior / Middle / Senior;
- случайная выборка вопросов за попытку;
- вопросы с одним и несколькими правильными вариантами;
- таймер прохождения;
- подсчёт результата и вердикта (Passed / On the edge / Failed);
- разбивка по категориям с выделением сильных и слабых сторон;
- сохранение результатов в PostgreSQL;
- HR‑дашборд с фильтрами, поиском и экспортом в CSV;
- публичные тесты по ссылке с токеном компании;
- тарифная система (Free trial / Paid);
- авторизация HR‑пользователей.

## Технологии

**Frontend:**
- HTML, CSS, чистый JavaScript (без фреймворков);
- хостинг: GitHub Pages (кастомный домен через CNAME).

**Backend:**
- Python 3.13;
- FastAPI;
- SQLAlchemy + psycopg;
- Uvicorn;
- хостинг: VPS (reg.ru).

**База данных:**
- PostgreSQL 17;
- хостинг: VPS (reg.ru);
- основные таблицы: `companies`, `company_hr_users`, `users`, `results`, `detailed_results`, `quiz_questions`.

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
│   └── app/
│       ├── main.py            # FastAPI endpoints
│       ├── models.py          # SQLAlchemy модели
│       ├── schemas.py         # Pydantic-схемы
│       ├── database.py        # Подключение к БД
│       ├── auth.py            # Авторизация и хеширование паролей
│       └── data/              # JSON-файлы с вопросами
└── tests/                     # Интеграционные тесты backend-а
```

## Локальный запуск

### Frontend

```bash
python -m http.server 8000
```

После запуска лендинг будет доступен по адресу `http://localhost:8000`.

### Backend

```bash
cd backend-api
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

По умолчанию API будет доступен по адресу `http://localhost:8000`.

## Тесты

```bash
cd backend-api
pip install pytest httpx
python -m pytest tests/test_api.py -v
```

В тестах используются:
- pytest;
- httpx / TestClient FastAPI;
- отдельная тестовая БД (in-memory).

## База данных

### companies

- `id` — SERIAL PRIMARY KEY  
- `name` — VARCHAR, UNIQUE  
- `public_token` — VARCHAR (токен для публичных тестов)  
- `is_paid` — BOOLEAN  
- `trial_tests_limit` — INTEGER  
- `trial_tests_used` — INTEGER  
- `created_at` — TIMESTAMP  

### company_hr_users

- `id` — SERIAL PRIMARY KEY  
- `company_id` — INTEGER (FK → companies)  
- `email` — VARCHAR, UNIQUE  
- `password_hash` — VARCHAR  
- `name` — VARCHAR  
- `role` — VARCHAR  
- `created_at` — TIMESTAMP  

### users

- `id` — SERIAL PRIMARY KEY  
- `first_name` — VARCHAR  
- `last_name` — VARCHAR  
- `email` — VARCHAR  
- `company_id` — FK → companies  
- `created_at` — TIMESTAMP  

### results

- `id` — SERIAL PRIMARY KEY  
- `user_id` — FK → users  
- `test_id` — VARCHAR  
- `total_score` — DECIMAL  
- `max_score` — DECIMAL  
- `percent` — INTEGER  
- `verdict` — VARCHAR  
- `company_id` — FK → companies  
- `created_at` — TIMESTAMP  

### detailed_results

- `id` — SERIAL PRIMARY KEY  
- `result_id` — FK → results  
- `category` — VARCHAR  
- `percent` — INTEGER  
- `is_strong` — BOOLEAN  
- `is_weak` — BOOLEAN  

### quiz_questions

- `id` — SERIAL PRIMARY KEY  
- `test_id` — VARCHAR (qa_junior_web / qa_middle_web / qa_senior_web)  
- `text` — VARCHAR  
- `options` — JSON  
- `correct_index` — INTEGER  
- `order` — INTEGER  
- `category` — VARCHAR  

## API

### Публичные

- `GET /health` — проверка работы API  
- `GET /public/tests/{test_id}` — получить вопросы теста  
- `POST /public/tests/{test_id}/submit?company_token=...` — отправить результат  

### Авторизация

- `POST /auth/register` — регистрация HR‑пользователя  
- `POST /auth/login` — вход HR‑пользователя  

### Компании

- `POST /companies` — создать компанию  
- `GET /public/companies/{public_token}` — информация о компании по токену  
- `GET /api/company/{company_id}/plan` — тариф компании  
- `POST /companies/{company_id}/upgrade` — апгрейд до платного тарифа  

### Кандидаты и результаты

- `POST /candidates` — создать кандидата  
- `GET /candidates/{candidate_id}` — получить кандидата  
- `POST /results` — сохранить результат  
- `GET /results/{result_id}` — получить результат  
- `POST /api/results` — сохранить публичный результат  
- `GET /api/company/{company_id}/results` — результаты компании  

## Деплой

- Frontend: GitHub Pages (автодеплой при push в `main`, домен через CNAME).  
- Backend: VPS (reg.ru), запуск через Uvicorn.  
- База данных: PostgreSQL на VPS (reg.ru).  

## Автор

Кирилл Пегашев — QA‑инженер и разработчик  
Email: [pegashevk4@gmail.com](mailto:pegashevk4@gmail.com)  
GitHub: [pegashevk4-rgb](https://github.com/pegashevk4-rgb)