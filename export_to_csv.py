import os
import sys
import pandas as pd
import psycopg

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/dbname",
)

QUERY = """
SELECT
    r.created_at                                          AS date_completed,
    u.first_name,
    u.last_name,
    u.email,
    r.total_score,
    r.max_score,
    r.percent,
    r.verdict
FROM results r
JOIN users u ON u.id = r.user_id
ORDER BY r.created_at DESC;
"""

OUTPUT_FILE = "quiz_results.csv"


def main():
    try:
        conn = psycopg.connect(DATABASE_URL)
    except Exception as e:
        print(f"❌ Не удалось подключиться к БД:\n{e}")
        sys.exit(1)

    try:
        df = pd.read_sql_query(QUERY, conn)
    except Exception as e:
        print(f"❌ Ошибка при выполнении запроса:\n{e}")
        sys.exit(1)
    finally:
        conn.close()

    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8-sig")

    print(f"✅ Данные экспортированы в {OUTPUT_FILE}")
    print(f"📊 Всего записей: {len(df)}")
    if not df.empty:
        print(f"\nПредпросмотр (первые 5 строк):")
        print(df.head().to_string(index=False))
    else:
        print("⚠️ Таблица результатов пуста.")


if __name__ == "__main__":
    main()
