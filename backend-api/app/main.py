from collections import defaultdict

from fastapi import FastAPI, Depends, HTTPException, status, Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from . import models, schemas
from .auth import get_password_hash, verify_password

import secrets
import string

import json
from pathlib import Path as FilePath

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Разрешённые источники (origin'ы) для разработки
origins = [
    "http://127.0.0.1:8001",
    "http://localhost:8001",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://pegashevk4-rgb.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_public_token(length: int = 32) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def map_test_title(test_id: str) -> str:
    if test_id == "qa_junior_web":
        return "Junior QA"
    if test_id == "qa_middle_web":
        return "Middle QA"
    if test_id == "qa_senior_web":
        return "Senior QA"
    return test_id


@app.get("/health")
def health_check():
    return {"status": "ok"}


# =========================
# HR / компании
# =========================

@app.post(
    "/auth/register",
    response_model=schemas.CompanyHRUserPublic,
    status_code=status.HTTP_201_CREATED,
)
def register_hr_user(
    payload: schemas.CompanyHRUserCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.CompanyHRUser)
        .filter(models.CompanyHRUser.email == payload.email)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hr_user = models.CompanyHRUser(
        company_id=payload.company_id,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        name=payload.name,
        role=payload.role or "manager",
    )
    db.add(hr_user)
    db.commit()
    db.refresh(hr_user)

    company = (
        db.query(models.Company)
        .filter(models.Company.id == hr_user.company_id)
        .first()
    )

    return schemas.CompanyHRUserPublic(
    id=hr_user.id,
    email=hr_user.email,
    name=hr_user.name,
    company_id=hr_user.company_id,
    role=hr_user.role,
    company_name=company.name if company else "",
    company_token=company.public_token if company else "",  # НОВОЕ
    )



@app.post("/auth/login", response_model=schemas.CompanyHRUserPublic)
def login_hr_user(
    payload: schemas.HRLoginRequest,
    db: Session = Depends(get_db),
):
    hr_user = (
        db.query(models.CompanyHRUser)
        .filter(models.CompanyHRUser.email == payload.email)
        .first()
    )
    if not hr_user or not verify_password(payload.password, hr_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    company = (
        db.query(models.Company)
        .filter(models.Company.id == hr_user.company_id)
        .first()
    )

    return schemas.CompanyHRUserPublic(
        id=hr_user.id,
        email=hr_user.email,
        name=hr_user.name,
        company_id=hr_user.company_id,
        role=hr_user.role,
        company_name=company.name if company else "",
        company_token=company.public_token if company else "",  # НОВОЕ
    )



@app.post(
    "/companies",
    response_model=schemas.CompanyPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_company(payload: schemas.CompanyCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.Company)
        .filter(models.Company.name == payload.name)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Company with this name already exists",
        )

    public_token = generate_public_token()

    company = models.Company(
        name=payload.name,
        public_token=public_token,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@app.post(
    "/companies/{company_id}/upgrade",
    response_model=schemas.CompanyPublic,
)
def upgrade_company(
    company_id: int = Path(...),
    db: Session = Depends(get_db),
):
    company = (
        db.query(models.Company)
        .filter(models.Company.id == company_id)
        .first()
    )
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if company.is_paid:
        return company

    company.is_paid = True
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@app.get(
    "/public/companies/{public_token}",
    response_model=schemas.CompanyPublic,
)
def get_company_by_public_token(
    public_token: str,
    db: Session = Depends(get_db),
):
    company = (
        db.query(models.Company)
        .filter(models.Company.public_token == public_token)
        .first()
    )
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


# =========================
# Кандидаты и результаты (внутренние)
# =========================

@app.post(
    "/candidates",
    response_model=schemas.CandidatePublic,
    status_code=status.HTTP_201_CREATED,
)
def create_candidate(payload: schemas.CandidateCreate, db: Session = Depends(get_db)):
    candidate = models.User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        company_id=payload.company_id,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@app.get("/candidates/{candidate_id}", response_model=schemas.CandidatePublic)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = (
        db.query(models.User)
        .filter(models.User.id == candidate_id)
        .first()
    )
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@app.post(
    "/results",
    response_model=schemas.ResultPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_result(payload: schemas.ResultCreate, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .filter(models.User.id == payload.user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    company = None
    if payload.company_id:
        company = (
            db.query(models.Company)
            .filter(models.Company.id == payload.company_id)
            .first()
        )
        if not company:
            raise HTTPException(status_code=400, detail="Company not found")

        if not company.is_paid:
            if company.trial_tests_used >= company.trial_tests_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "Trial tests limit reached. "
                        "Please upgrade to a paid plan."
                    ),
                )
            company.trial_tests_used += 1
            db.add(company)

    result = models.Result(
        user_id=payload.user_id,
        test_id=payload.test_id,
        total_score=payload.total_score,
        max_score=payload.max_score,
        percent=payload.percent,
        verdict=payload.verdict,
        company_id=payload.company_id,
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    for item in payload.details:
        detail = models.DetailedResult(
            result_id=result.id,
            category=item.category,
            percent=item.percent,
            is_strong=item.is_strong,
            is_weak=item.is_weak,
        )
        db.add(detail)

    db.commit()
    db.refresh(result)
    return result


@app.get("/results/{result_id}", response_model=schemas.ResultPublic)
def get_result(result_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(models.Result)
        .filter(models.Result.id == result_id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result


@app.post("/api/results")
def save_public_result(data: schemas.TestResultIn, db: Session = Depends(get_db)):
    company = (
        db.query(models.Company)
        .filter(models.Company.public_token == data.company_token)
        .first()
    )
    if not company:
        raise HTTPException(status_code=400, detail="Unknown company token")

    user = None
    if data.email:
        user = (
            db.query(models.User)
            .filter(
                models.User.company_id == company.id,
                models.User.email == data.email,
            )
            .first()
        )

    if not user:
        user = models.User(
            company_id=company.id,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email or None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.first_name = data.first_name
        user.last_name = data.last_name
        db.commit()
        db.refresh(user)

    result = models.Result(
        user_id=user.id,
        company_id=company.id,
        test_id=data.test_id,
        total_score=data.total_score,
        max_score=data.max_score,
        percent=data.percent,
        verdict=data.verdict,
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    strong_cats = {cat.category for cat in data.strong_areas}
    weak_cats = {cat.category for cat in data.weak_areas}

    for cat in data.categories:
        detail = models.DetailedResult(
            result_id=result.id,
            category=cat.category,
            percent=cat.percent,
            is_strong=cat.category in strong_cats,
            is_weak=cat.category in weak_cats,
        )
        db.add(detail)

    db.commit()
    return {"status": "success", "result_id": result.id}


@app.get(
    "/api/company/{company_id}/results",
    response_model=list[schemas.ResultRow],
)
def get_company_results(
    company_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            models.Result.id.label("result_id"),
            models.Result.user_id,
            models.User.first_name,
            models.User.last_name,
            models.User.email,
            models.Result.test_id,
            models.Result.percent,
            models.Result.verdict,
            models.Result.created_at,
        )
        .join(models.User, models.User.id == models.Result.user_id)
        .filter(models.Result.company_id == company_id)
        .order_by(models.Result.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        schemas.ResultRow(
            result_id=r.result_id,
            user_id=r.user_id,
            first_name=r.first_name,
            last_name=r.last_name,
            email=r.email,
            test_id=r.test_id,
            percent=r.percent,
            verdict=r.verdict,
            created_at=r.created_at,
        )
        for r in rows
    ]


# =========================
# Публичные тесты
# =========================

@app.get("/public/tests/{test_id}", response_model=schemas.TestPublic)
def get_test_public(
    test_id: str,
    db: Session = Depends(get_db),
):
    questions = (
        db.query(models.QuizQuestion)
        .filter(models.QuizQuestion.test_id == test_id)
        .order_by(models.QuizQuestion.order.asc(), models.QuizQuestion.id.asc())
        .all()
    )
    if not questions:
        raise HTTPException(status_code=404, detail="Test not found")

    return schemas.TestPublic(
        test_id=test_id,
        title=map_test_title(test_id),
        questions=[
            schemas.QuestionPublic(
                id=q.id,
                text=q.text,
                options=q.options,
            )
            for q in questions
        ],
    )


@app.post(
    "/public/tests/{test_id}/submit",
    response_model=schemas.TestResultResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_test(
    test_id: str,
    payload: schemas.TestSubmitWithCandidate,
    company_token: str,
    db: Session = Depends(get_db),
):
    # 1. Компания по токену
    company = (
        db.query(models.Company)
        .filter(models.Company.public_token == company_token)
        .first()
    )
    if not company:
        raise HTTPException(status_code=400, detail="Unknown company token")

    # 2. Лимит триала
    if not company.is_paid:
        if company.trial_tests_used >= company.trial_tests_limit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Trial tests limit reached. "
                    "Please upgrade to a paid plan."
                ),
            )

    # 3. Вопросы
    db_questions = (
        db.query(models.QuizQuestion)
        .filter(models.QuizQuestion.test_id == test_id)
        .all()
    )
    if not db_questions:
        raise HTTPException(status_code=404, detail="Test not found")

    q_by_id: dict[int, models.QuizQuestion] = {q.id: q for q in db_questions}

    total = len(db_questions)
    correct = 0

    # агрегат по категориям
    cat_stats: dict[str, dict[str, int]] = defaultdict(lambda: {"correct": 0, "total": 0})

    for a in payload.answers:
        q = q_by_id.get(a.question_id)
        if not q:
            continue

        cat_name = getattr(q, "category", None) or "Общее"
        cat_stats[cat_name]["total"] += 1

        if a.selected_index == q.correct_index:
            correct += 1
            cat_stats[cat_name]["correct"] += 1

    percent = int(round(correct * 100 / total)) if total else 0

    if percent >= 80:
        verdict = "Passed"
    elif percent >= 50:
        verdict = "On the edge"
    else:
        verdict = "Failed"

    # 4. Кандидат
    user = None
    if payload.candidate.email:
        user = (
            db.query(models.User)
            .filter(
                models.User.company_id == company.id,
                models.User.email == payload.candidate.email,
            )
            .first()
        )

    if not user:
        user = models.User(
            company_id=company.id,
            first_name=payload.candidate.first_name,
            last_name=payload.candidate.last_name,
            email=payload.candidate.email or None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.first_name = payload.candidate.first_name
        user.last_name = payload.candidate.last_name
        db.commit()
        db.refresh(user)

    # 5. Result
    total_score = correct
    max_score = total

    result = models.Result(
        user_id=user.id,
        company_id=company.id,
        test_id=test_id,
        total_score=total_score,
        max_score=max_score,
        percent=percent,
        verdict=verdict,
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    # 6. DetailedResult + подготовка данных для фронта
    detailed_rows: list[schemas.CategoryBreakdownItem] = []
    strong_areas: list[schemas.AreaItem] = []
    weak_areas: list[schemas.AreaItem] = []

    for cat_name, stats in cat_stats.items():
        cat_total = stats["total"]
        cat_correct = stats["correct"]
        cat_percent = int(round(cat_correct * 100 / cat_total)) if cat_total else 0

        detailed = models.DetailedResult(
            result_id=result.id,
            category=cat_name,
            percent=cat_percent,
            is_strong=cat_percent >= 80,
            is_weak=cat_percent < 50,
        )
        db.add(detailed)

        detailed_rows.append(
            schemas.CategoryBreakdownItem(
                category=cat_name,
                correct=cat_correct,
                total=cat_total,
                percent=cat_percent,
            )
        )

        if cat_percent >= 80:
            strong_areas.append(schemas.AreaItem(category=cat_name))
        elif cat_percent < 50:
            weak_areas.append(schemas.AreaItem(category=cat_name))

    # общий "Overall" как и раньше
    overall_detail = models.DetailedResult(
        result_id=result.id,
        category="Overall",
        percent=percent,
        is_strong=percent >= 80,
        is_weak=percent < 50,
    )
    db.add(overall_detail)

    # 7. Обновляем счётчик триала
    if not company.is_paid:
        company.trial_tests_used = (company.trial_tests_used or 0) + 1
        db.add(company)

    db.commit()

    return schemas.TestResultResponse(
        percent=percent,
        verdict=verdict,
        strong_areas=strong_areas,
        weak_areas=weak_areas,
        categories=detailed_rows,
    )


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

#if __name__ == "__main__":
    #import_junior_questions_from_json("app/data/questions_junior.json")
    #import_middle_questions_from_json("app/data/questions_middle.json")
    #import_senior_questions_from_json("app/data/questions_senior.json")