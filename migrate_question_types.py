"""
Одноразовый скрипт: обновляет question_type и correct_indexes
для вопросов, уже существующих в БД, на основе JSON-файлов.

Запуск: python migrate_question_types.py
"""
import json
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = sys.argv[1] if len(sys.argv) > 1 else "sqlite:///quiz_results.db"

TEST_MAP = {
    "junior": "qa_junior_web",
    "middle": "qa_middle_web",
    "senior": "qa_senior_web",
}

JSON_MAP = {
    "junior": Path("backend-api/app/data/questions_junior.json"),
    "middle": Path("backend-api/app/data/questions_middle.json"),
    "senior": Path("backend-api/app/data/questions_senior.json"),
}


def main():
    engine = create_engine(DATABASE_URL)

    for level, json_path in JSON_MAP.items():
        test_id = TEST_MAP[level]
        if not json_path.exists():
            print(f"SKIP {json_path} not found")
            continue

        with open(json_path, encoding="utf-8") as f:
            data = json.load(f)

        json_by_text = {}
        for item in data:
            if item.get("level") != level:
                continue
            json_by_text[item["question"]] = item

        with engine.begin() as conn:
            rows = conn.execute(
                text("SELECT id, text, correct_index FROM quiz_questions WHERE test_id = :tid"),
                {"tid": test_id},
            ).fetchall()

            updated = 0
            for row in rows:
                qid, qtext, _ = row
                item = json_by_text.get(qtext)
                if not item:
                    continue

                q_type = item.get("type") or "single"
                correct_indexes = item.get("correct_indexes") or []

                conn.execute(
                    text(
                        "UPDATE quiz_questions "
                        "SET question_type = :qt, correct_indexes = :ci "
                        "WHERE id = :qid"
                    ),
                    {"qt": q_type, "ci": json.dumps(correct_indexes), "qid": qid},
                )
                updated += 1

            print(f"{test_id}: обновлено {updated} из {len(rows)} вопросов")

    print("Готово.")


if __name__ == "__main__":
    main()
