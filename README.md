## QA Quiz Web

Веб‑приложение для тестирования знаний по QA (Junior / Middle / Senior) с онлайн‑квизами и автоматическим отчётом по сильным и слабым сторонам.

## Демо

GitHub Pages (frontend, без VPN):

- Junior: https://pegashevk4-rgb.github.io/qa-quiz-web/index.html?test_id=qa_junior_web  
- Middle: https://pegashevk4-rgb.github.io/qa-quiz-web/index.html?test_id=qa_middle_web  
- Senior: https://pegashevk4-rgb.github.io/qa-quiz-web/index.html?test_id=qa_senior_web

## Что умеет сейчас

- Три уровня сложности: Junior / Middle / Senior.
- Выбор теста через test_id в query‑параметре (qa_junior_web, qa_middle_web, qa_senior_web).
- До 30 случайных вопросов за попытку (можно менять через QUESTIONS_PER_RUN в app.js).
- Поддержка вопросов с одним и несколькими правильными вариантами.
- Таймер прохождения, зависящий от уровня (junior/middle/senior).
- Подсчёт общего процента и предварительная оценка (например, Strong Middle, Not recommended).
- Автоматический расчёт результатов по категориям (q.category) с выделением сильных/слабых зон.
- Форма ввода имени/фамилии/email перед показом результата (подготовка к сохранению в базу).
- Интерфейс на русском, поддержка кириллицы.
- Защита от копирования текста квиза (отключено выделение текста в зоне теста).

## Локальный запуск (frontend)
Минимальный вариант:
- Откройте `index.html` в браузере  
  или  
- Запустите локальный сервер в корне проекта:

```bash
python -m http.server 8000
```

и перейдите по адресу `http://localhost:8000/`.

## Технологии

- **Frontend:** HTML, CSS, чистый JavaScript (без фреймворков). 
- **Backend (опционально / в разработке):** Python, Flask, SQLite, интеграция с Google Sheets (gspread).
- **Интеграция:** Google Sheets API (через сервисный аккаунт).
- **Хостинг фронтенда:** GitHub Pages.

## Структура проекта

```text
qa-quiz-web/
├── index.html          # Страница квиза (frontend)
├── app.js              # Логика квиза на стороне клиента
├── style.css           # Стили
├── server.py           # Flask-сервер и API (загрузка тестов, сохранение результатов) [опционально]
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

2. app.js по test_id выбирает JSON‑файл с вопросами, загружает их, перемешивает и ограничивает количеством QUESTIONS_PER_RUN.

3. Вопросы задаются по одному, варианты ответа тоже перемешиваются.

4. Для каждого вопроса считается балл (1 за одиночный ответ, дробный за multiple‑choice с частично верными/лишними вариантами).

5. После окончания теста пользователь вводит свои данные (имя, фамилия, email).

6. Приложение считает:
- общий процент;
- вердикт по порогам (Strong Middle, Middle, Junior+, Not recommended);
- результат по каждой категории (q.category);
- топ‑2 сильных и топ‑2 слабых зон (если общий результат ≥ 30%).

7. Сейчас результат просто логируется в консоль (как подготовка к интеграции с backend/API).

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
