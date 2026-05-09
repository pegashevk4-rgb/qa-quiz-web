# QA Quiz Web Application

Веб‑приложение для тестирования знаний по QA (Junior / Middle / Senior) с сохранением результатов и онлайн‑доступом через PythonAnywhere.

## Онлайн‑демо

Продакшен‑версии квизов уже доступны по ссылкам:

- **QA Junior (Web):**  
  https://kirilla5.pythonanywhere.com/quiz/index.html?test_id=qa_junior_web
- **QA Middle (Web):**  
  https://kirilla5.pythonanywhere.com/quiz/index.html?test_id=qa_middle_web
- **QA Senior (Web):**  
  https://kirilla5.pythonanywhere.com/quiz/index.html?test_id=qa_senior_web

Каждая ссылка открывает тот же frontend, но с разным `test_id`, который подтягивает соответствующий набор вопросов с backend‑API.

## Особенности

- Несколько квизов под разные уровни: **Junior / Middle / Senior**.
- Вопросы отдаются с backend‑API по `test_id` (например, `qa_middle_web`).
- До 30 случайных вопросов за одну попытку (`QUESTIONS_PER_RUN`).
- Подсчёт результата и отображение процента правильных ответов.
- Форма ввода имени/фамилии/email перед показом результата.
- Сохранение результатов через API (может быть привязано к БД и/или Google Sheets).
- Полностью на русском, поддержка кириллицы.
- Стэк: **Flask backend + Vanilla JS frontend**, деплой на **PythonAnywhere**.

## Технологии

- **Backend:** Python, Flask, SQLite (опционально), интеграция с Google Sheets (gspread).
- **Frontend:** HTML, CSS, JavaScript (без фреймворков).
- **Интеграция:** Google Sheets API (через сервисный аккаунт).
- **Деплой:** PythonAnywhere (backend + статический frontend).

## Структура проекта

```text
qa-quiz-web/
├── index.html          # Страница квиза (frontend)
├── app.js              # Логика квиза на стороне клиента
├── style.css           # Стили
├── server.py           # Flask-сервер и API (загрузка тестов, сохранение результатов)
├── export_to_csv.py    # Скрипт экспорта результатов из БД в CSV
├── view_results.py     # Скрипт просмотра результатов и выгрузки в Google Sheets
├── quiz_results.db     # Локальная база данных SQLite (игнорируется в Git)
├── requirements.txt    # Python-зависимости
├── .env.example        # Шаблон переменных окружения для интеграции с Google Sheets
├── .gitignore          # Настройки Git-игнора
└── README.md           # Документация
```

## Как это работает

1. Пользователь открывает одну из ссылок (Junior / Middle / Senior), где уровень задаётся через `test_id` в query‑параметре.
2. Frontend (`index.html + app.js`) отправляет запрос к API:
   - `GET /api/test/<test_id>` — загрузка набора вопросов (категория, текст вопроса, варианты, индекс правильного ответа).
3. Квиз показывает вопросы по одному, перемешивает варианты, подсвечивает правильный/неправильный ответ.
4. После прохождения теста пользователь вводит свои данные (имя, фамилия, email), и результат отправляется на сервер:
   - `POST /api/save-result` — сохранение результата (балл, процент, test_id, контактные данные).
5. Backend может:
   - сохранять данные в SQLite;
   - отправлять результаты в Google Sheets для аналитики и отчётности.

## Локальный запуск backend'а

Если нужно развернуть backend локально:

1. Клонировать репозиторий:

```bash
git clone https://github.com/pegashevk4-rgb/qa-quiz-web.git
cd qa-quiz-web
```

2. Создать виртуальное окружение и установить зависимости:

```bash
python -m venv .venv
. .venv/bin/activate      # Linux/Mac
# или
.venv\Scripts\activate    # Windows

pip install -r requirements.txt
```

3. (Опционально) Настроить интеграцию с Google Sheets:

Создать файл `.env` (на основе `.env.example`):

```bash
cp .env.example .env
```

Заполнить `.env` своими данными:
- `SERVICE_ACCOUNT_FILE` — имя JSON‑файла с ключом Google API.
- `SPREADSHEET_ID` — ID вашей Google Таблицы (из URL).

Шаги по настройке Google Sheets API:
- Создать проект в [Google Cloud Console](https://console.cloud.google.com).
- Включить Google Sheets API.
- Создать сервисный аккаунт и скачать JSON‑ключ.
- Поместить JSON‑ключ в корень проекта.
- Добавить email сервисного аккаунта (`...@....iam.gserviceaccount.com`) в настройки доступа Google Таблицы как **Редактор**.

4. Запустить сервер:

```bash
python server.py
```

Открыть в браузере: `http://localhost:5000`

(Frontend можно раздавать либо из самого Flask, либо как статические файлы с любого статического сервера, указывая в `app.js` базовый URL API.)

## Деплой на PythonAnywhere (кратко)

- Код backend'а и конфиг Flask разворачиваются как Web App на `kirilla5.pythonanywhere.com`.
- Статические файлы (`index.html`, `app.js`, `style.css`) лежат в `/home/KirillA5/qa-quiz-web-static` и проброшены в разделе **Static files** как:
  - URL: `/quiz/`
  - Directory: `/home/KirillA5/qa-quiz-web-static`
- Frontend использует API по адресу `https://kirilla5.pythonanywhere.com/api/...` с динамическим `test_id`.

Итоговые боевые ссылки:

- Junior — `?test_id=qa_junior_web`
- Middle — `?test_id=qa_middle_web`
- Senior — `?test_id=qa_senior_web`

## Для кого и сценарии использования

- **HR и рекрутеры.** Быстрая первичная оценка уровня кандидата по QA без ручной проверки.
- **Тимлиды и руководители.** Регулярный чек‑ап команды, отслеживание прогресса и слабых зон.
- **Кандидаты и джуны.** Тренировка перед собеседованием на реальных вопросах по QA.
- **Курсы и менторы.** Готовый инструмент для контрольных работ и домашних заданий.

Примеры сценариев:

- отправка ссылки на квиз кандидату перед техническим интервью;
- периодическое тестирование команды раз в квартал с анализом результатов в Google Sheets;
- самоподготовка и самооценка знаний по QA.

## Автор

Кирилл Пегашев — Junior Python Developer / QA Engineer  
GitHub: https://github.com/pegashevk4-rgb
