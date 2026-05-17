from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:pass@localhost:5433/qa_quiz"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


app = FastAPI()

# CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Pydantic-модели ----------

class Category(BaseModel):
    category: str
    percent: int


class TestResult(BaseModel):
    company_id: int                # из ссылки/конфига
    first_name: str
    last_name: str
    email: Optional[str] = None
    test_id: str
    total_score: float
    max_score: float
    percent: int
    verdict: str
    categories: List[Category]
    strong_areas: List[Category]
    weak_areas: List[Category]


# ---------- SQLAlchemy-модели ----------

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CompanyUser(Base):
    __tablename__ = "company_users"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="manager")
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    test_id = Column(String(50), nullable=False)
    total_score = Column(Numeric(5, 2), nullable=False)
    max_score = Column(Numeric(5, 2), nullable=False)
    percent = Column(Integer, nullable=False)
    verdict = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)


class DetailedResult(Base):
    __tablename__ = "detailed_results"

    id = Column(Integer, primary_key=True)
    result_id = Column(Integer, ForeignKey("results.id"), nullable=False)
    category = Column(String(100), nullable=False)
    percent = Column(Integer, nullable=False)
    is_strong = Column(Boolean, default=False)
    is_weak = Column(Boolean, default=False)


# ---------- Маршруты ----------

@app.get("/")
async def root():
    return {"message": "QA Quiz API is running"}


@app.post("/api/results")
async def save_results(data: TestResult):
    db = SessionLocal()
    try:
        # 1. Проверяем, что компания существует
        company = db.query(Company).filter(Company.id == data.company_id).first()
        if not company:
            raise HTTPException(status_code=400, detail="Unknown company")

        # 2. Ищем кандидата только внутри этой компании
        user = None
        if data.email:
            user = (
                db.query(User)
                  .filter(
                      User.company_id == data.company_id,
                      User.email == data.email
                  )
                  .first()
            )

        if not user:
            # создаём нового кандидата
            user = User(
                company_id=data.company_id,
                first_name=data.first_name,
                last_name=data.last_name,
                email=data.email or None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # обновляем имя/фамилию при повторных прохождениях
            user.first_name = data.first_name
            user.last_name = data.last_name
            db.commit()
            db.refresh(user)

        # 3. Сохраняем результат теста
        result = Result(
            user_id=user.id,
            test_id=data.test_id,
            total_score=data.total_score,
            max_score=data.max_score,
            percent=data.percent,
            verdict=data.verdict
        )
        db.add(result)
        db.commit()
        db.refresh(result)

        # 4. Сохраняем детальные результаты
        strong_cats = {cat.category for cat in data.strong_areas}
        weak_cats = {cat.category for cat in data.weak_areas}

        for cat in data.categories:
            detailed = DetailedResult(
                result_id=result.id,
                category=cat.category,
                percent=cat.percent,
                is_strong=cat.category in strong_cats,
                is_weak=cat.category in weak_cats
            )
            db.add(detailed)

        db.commit()
        return {"status": "success", "result_id": result.id}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
