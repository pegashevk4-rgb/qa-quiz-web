from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy import create_engine, Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# ВАЖНО: Замени YOUR_PASSWORD на свой пароль PostgreSQL!
DATABASE_URL = "postgresql://postgres:13Reno!@localhost:5433/qa_quiz"

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

# Pydantic модели для валидации данных
class Category(BaseModel):
    category: str
    percent: int

class TestResult(BaseModel):
    first_name: str
    last_name: str
    email: str
    test_id: str
    total_score: float
    max_score: float
    percent: int
    verdict: str
    categories: List[Category]
    strong_areas: List[Category]
    weak_areas: List[Category]

# SQLAlchemy модели для БД
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Result(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    test_id = Column(String(50))
    total_score = Column(Numeric(5, 2))
    max_score = Column(Numeric(5, 2))
    percent = Column(Integer)
    verdict = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

class DetailedResult(Base):
    __tablename__ = "detailed_results"
    id = Column(Integer, primary_key=True)
    result_id = Column(Integer, ForeignKey("results.id"))
    category = Column(String(100))
    percent = Column(Integer)
    is_strong = Column(Boolean, default=False)
    is_weak = Column(Boolean, default=False)

@app.get("/")
async def root():
    return {"message": "QA Quiz API is running"}

@app.post("/api/results")
async def save_results(data: TestResult):
    db = SessionLocal()
    try:
        # Найти или создать пользователя
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            user = User(
                first_name=data.first_name,
                last_name=data.last_name,
                email=data.email
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Сохранить результат теста
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
        
        # Сохранить детальные результаты
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
