import sqlite3

conn = sqlite3.connect('quiz_results.db')
cursor = conn.cursor()
cursor.execute('SELECT * FROM results ORDER BY date_completed DESC')
results = cursor.fetchall()

print("=== Результаты квиза ===\n")
if len(results) == 0:
    print("Пока нет сохраненных результатов")
else:
    for row in results:
        print(f"ID: {row[0]}")
        print(f"Имя: {row[1]} {row[2]}")
        print(f"Email: {row[3]}")
        print(f"Результат: {row[4]}/{row[5]} ({row[6]:.1f}%)")
        print(f"Дата: {row[7]}")
        print("-" * 40)

conn.close()
