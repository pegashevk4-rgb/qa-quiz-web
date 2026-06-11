# QA Quiz Web

QA Quiz Web — pet-проект для оценки QA-кандидатов.  
Сервис включает:
- онлайн-квиз для кандидатов;
- HR-лендинг и дашборд для рекрутеров;
- бэкенд API с сохранением результатов в PostgreSQL.

## Демо

- Главная: [QA Quiz Web](https://pegashevk4-rgb.github.io/qa-quiz-web/)
- API: [qa-quiz-web.vercel.app](https://qa-quiz-web.vercel.app)

## Что реализовано

- тесты для уровней Junior / Middle / Senior;
- случайная выборка вопросов за попытку;
- вопросы с одним и несколькими правильными вариантами;
- таймер прохождения;
- подсчёт результата и вердикта;
- сохранение результатов в PostgreSQL;
- HR-дашборд для просмотра кандидатов;
- адаптивный интерфейс.

## HR-модуль

В проекте есть отдельный модуль для HR:
- HR Landing — страница с описанием сервиса;
- HR Dashboard — прототип панели для работы с кандидатами;
- в дальнейшем планируется подключение к реальной БД и авторизация.

## Технологии

**Frontend:**
- HTML, CSS, чистый JavaScript;
- хостинг: GitHub Pages.

**Backend:**
- Python 3.10+;
- FastAPI;
- SQLAlchemy;
- Uvicorn;
- хостинг: Vercel.

**База данных:**
- PostgreSQL 17;
- хостинг: Neon.tech;
- таблицы: `users`, `results`, `detailed_results`.

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
    └── vercel.json         # Конфигурация деплоя
```

## Локальный запуск

### Frontend
```bash
python -m http.server 8000
```

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

## База данных

### users
- `id` — SERIAL PRIMARY KEY
- `first_name` — VARCHAR
- `last_name` — VARCHAR
- `email` — VARCHAR, UNIQUE
- `created_at` — TIMESTAMP

### results
- `id` — SERIAL PRIMARY KEY
- `user_id` — FK → users
- `test_id` — VARCHAR
- `total_score` — DECIMAL
- `max_score` — DECIMAL
- `percent` — INTEGER
- `verdict` — VARCHAR
- `created_at` — TIMESTAMP

### detailed_results
- `id` — SERIAL PRIMARY KEY
- `result_id` — FK → results
- `category` — VARCHAR
- `percent` — INTEGER
- `is_strong` — BOOLEAN
- `is_weak` — BOOLEAN

## API

- `GET /` — проверка работы API
- `POST /api/results` — сохранение результата теста

## Планы развития

- пройти и протестировать полный пользовательский путь:
  HR → ссылка → кандидат → результат в дашборде;
- добавить экспорт результатов в CSV (и при необходимости в Excel);
- после этого зафиксировать первую стабильную версию и использовать проект как кейс для портфолио.
- В дальнейшем возможны точечные улучшения (UI/UX, дополнительные метрики), но больших изменений не планируется.

## Деплой

- Frontend автоматически деплоится на GitHub Pages при push в `main`.
- Backend автоматически деплоится на Vercel при push в `main`.
- База данных размещена на Neon.tech.

## Автор

Кирилл Пегашев — QA-инженер и разработчик  
Email: [pegashevk4@gmail.com](mailto:pegashevk4@gmail.com)  
GitHub: [pegashevk4-rgb](https://github.com/pegashevk4-rgb)
