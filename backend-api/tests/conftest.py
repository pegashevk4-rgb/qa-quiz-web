import os

os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.main import app, get_db
from app import models

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


import app.database as database_module
import app.main as main_module

database_module.engine = test_engine
database_module.SessionLocal = TestSessionLocal
main_module.engine = test_engine
main_module.SessionLocal = TestSessionLocal


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def setup_db():
    yield
    with test_engine.connect() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
        conn.commit()


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture()
def db():
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient
    return TestClient(app)


@pytest.fixture()
def sample_company(db):
    from app.models import Company
    company = Company(
        name="TestCorp",
        public_token="test_token_abc123",
        is_paid=False,
        trial_tests_limit=10,
        trial_tests_used=0,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@pytest.fixture()
def sample_questions(db):
    from app.models import QuizQuestion
    questions = [
        QuizQuestion(
            test_id="qa_junior_web",
            text="Что такое тест-кейс?",
            options=["Описание набора действий", "Описание архитектуры", "Документ", "План"],
            correct_index=0,
            order=1,
            category="Основы тестирования",
        ),
        QuizQuestion(
            test_id="qa_junior_web",
            text="Что такое баг-репорт?",
            options=["Документ о дефекте", "Требования", "План", "Список"],
            correct_index=0,
            order=2,
            category="Основы тестирования",
        ),
        QuizQuestion(
            test_id="qa_junior_web",
            text="Какой инструмент для API-тестов?",
            options=["Postman", "Figma", "Photoshop", "Excel"],
            correct_index=0,
            order=3,
            category="Инструменты",
        ),
    ]
    db.add_all(questions)
    db.commit()
    for q in questions:
        db.refresh(q)
    return questions
