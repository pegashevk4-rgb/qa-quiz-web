# app/seeds/quiz_questions.py
from pathlib import Path as FilePath
import json

from app.database import SessionLocal
from app import models

def seed_questions():
    db = SessionLocal()
    try:
        existing = db.query(models.QuizQuestion).first()
        if existing:
            print("Questions already seeded")
            return

        q1 = models.QuizQuestion(
            test_id="qa_junior_web",
            text="Что такое тест-кейс?",
            options=[
                "Описание набора действий для проверки функционала",
                "Описание архитектуры системы",
                "Описание багов",
                "Описание требований к системе",
            ],
            correct_index=0,
            order=1,
        )

        q2 = models.QuizQuestion(
            test_id="qa_junior_web",
            text="Что такое баг-репорт?",
            options=[
                "Документ, описывающий найденный дефект",
                "Документ с требованиями",
                "План тестирования",
                "Список тест-кейсов",
            ],
            correct_index=0,
            order=2,
        )

        db.add_all([q1, q2])
        db.commit()
        print("Seed done")
    finally:
        db.close()

def import_junior_questions_from_json(json_path: str):
    db = SessionLocal()
    try:
        path = FilePath(json_path)
        if not path.exists():
            print(f"JSON file not found: {path}")
            return

        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        # Очищаем старые junior-вопросы (если нужно)
        db.query(models.QuizQuestion).filter(
            models.QuizQuestion.test_id == "qa_junior_web"
        ).delete()
        db.commit()

        questions: list[models.QuizQuestion] = []

        order_counter = 1
        for item in data:
            # Пропускаем не junior-уровень на всякий случай
            if item.get("level") != "junior":
                continue

            # Берём первую правильную опцию (для type=multiple берём просто первый индекс)
            correct_indexes = item.get("correct_indexes") or []
            if not correct_indexes:
                continue

            correct_index = correct_indexes[0]

            q = models.QuizQuestion(
                test_id="qa_junior_web",
                text=item["question"],
                options=item["options"],
                correct_index=correct_index,
                correct_indexes=correct_indexes,
                question_type=item.get("type") or "single",
                order=order_counter,
                category=item.get("category") or "Общее",
            )
            questions.append(q)
            order_counter += 1

        db.add_all(questions)
        db.commit()
        print(f"Imported {len(questions)} junior questions from {path}")
    finally:
        db.close()

def import_middle_questions_from_json(json_path: str):
    db = SessionLocal()
    try:
        path = FilePath(json_path)
        if not path.exists():
            print(f"JSON file not found: {path}")
            return

        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        db.query(models.QuizQuestion).filter(
            models.QuizQuestion.test_id == "qa_middle_web"
        ).delete()
        db.commit()

        questions: list[models.QuizQuestion] = []
        order_counter = 1

        for item in data:
            if item.get("level") != "middle":
                continue

            correct_indexes = item.get("correct_indexes") or []
            if not correct_indexes:
                continue

            correct_index = correct_indexes[0]

            q = models.QuizQuestion(
                test_id="qa_middle_web",
                text=item["question"],
                options=item["options"],
                correct_index=correct_index,
                correct_indexes=correct_indexes,
                question_type=item.get("type") or "single",
                order=order_counter,
                category=item.get("category") or "Общее",
            )
            questions.append(q)
            order_counter += 1

        db.add_all(questions)
        db.commit()
        print(f"Imported {len(questions)} middle questions from {path}")
    finally:
        db.close()

def import_senior_questions_from_json(json_path: str):
    db = SessionLocal()
    try:
        path = FilePath(json_path)
        if not path.exists():
            print(f"JSON file not found: {path}")
            return

        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        db.query(models.QuizQuestion).filter(
            models.QuizQuestion.test_id == "qa_senior_web"
        ).delete()
        db.commit()

        questions: list[models.QuizQuestion] = []
        order_counter = 1

        for item in data:
            if item.get("level") != "senior":
                continue

            correct_indexes = item.get("correct_indexes") or []
            if not correct_indexes:
                continue

            correct_index = correct_indexes[0]

            q = models.QuizQuestion(
                test_id="qa_senior_web",
                text=item["question"],
                options=item["options"],
                correct_index=correct_index,
                correct_indexes=correct_indexes,
                question_type=item.get("type") or "single",
                order=order_counter,
                category=item.get("category") or "Общее",
            )
            questions.append(q)
            order_counter += 1

        db.add_all(questions)
        db.commit()
        print(f"Imported {len(questions)} senior questions from {path}")
    finally:
        db.close()

if __name__ == "__main__":
    import_junior_questions_from_json("app/data/questions_junior.json")
    import_middle_questions_from_json("app/data/questions_middle.json")
    import_senior_questions_from_json("app/data/questions_senior.json")