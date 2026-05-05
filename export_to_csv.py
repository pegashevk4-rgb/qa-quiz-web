import sqlite3
import pandas as pd

# Подключение к БД
conn = sqlite3.connect('quiz_results.db')

# Чтение данных
df = pd.read_sql_query("SELECT * FROM results ORDER BY date_completed DESC", conn)

# Экспорт в CSV
df.to_csv('quiz_results.csv', index=False, encoding='utf-8-sig')

print("✅ Данные экспортированы в quiz_results.csv")
print(f"📊 Всего записей: {len(df)}")
print("\nПредпросмотр:")
print(df)

conn.close()
