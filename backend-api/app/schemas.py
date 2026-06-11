from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    company: str | None = None


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    name: str
    company: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # для .model_validate / ORM объектов


class CompanyHRUserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    company_id: int
    role: str | None = "manager"


class CompanyHRUserPublic(BaseModel):
    id: int
    email: str
    name: str
    company_id: int
    role: str
    company_name: str
    company_token: str  # НОВОЕ

    class Config:
        from_attributes = True


class CompanyCreate(BaseModel):
    name: str


class CompanyPublic(BaseModel):
    id: int
    name: str
    public_token: str | None = None
    is_paid: bool
    trial_tests_limit: int
    trial_tests_used: int

    class Config:
        from_attributes = True


class CandidateCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr | None = None
    company_id: int


class CandidatePublic(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr | None = None
    company_id: int | None = None

    class Config:
        from_attributes = True


class DetailedResultItem(BaseModel):
    category: str
    percent: int
    is_strong: bool = False
    is_weak: bool = False


class ResultCreate(BaseModel):
    user_id: int
    test_id: str
    total_score: float
    max_score: float
    percent: int
    verdict: str | None = None
    company_id: int | None = None
    details: list[DetailedResultItem] = []


class ResultPublic(BaseModel):
    id: int
    user_id: int
    test_id: str
    total_score: float
    max_score: float
    percent: int
    verdict: str | None
    company_id: int | None = None
    details: list[DetailedResultItem] = []

    class Config:
        from_attributes = True


class Category(BaseModel):
    category: str
    percent: int


class TestResultIn(BaseModel):
    company_token: str
    first_name: str
    last_name: str
    email: EmailStr | None = None
    test_id: str
    total_score: float
    max_score: float
    percent: int
    verdict: str
    categories: list[Category]
    strong_areas: list[Category]
    weak_areas: list[Category]
    
class CategorySummary(BaseModel):
    category: str
    percent: int
    correct: int | None = None
    total: int | None = None

class ResultRow(BaseModel):
    result_id: int
    user_id: int
    first_name: str
    last_name: str
    email: EmailStr | None
    test_id: str
    percent: int
    verdict: str
    created_at: datetime
    categories: list[CategorySummary] = []  # НОВОЕ

    class Config:
        from_attributes = True



class HRLoginRequest(BaseModel):
    email: EmailStr
    password: str


# ===== НОВОЕ: схемы для публичных тестов =====

class QuestionPublic(BaseModel):
    id: int
    text: str
    options: List[str]

    class Config:
        orm_mode = True


class TestPublic(BaseModel):
    test_id: str
    title: str
    questions: List[QuestionPublic]


class AnswerItem(BaseModel):
    question_id: int
    selected_index: int


class CandidateInfo(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr | None = None


class TestSubmitWithCandidate(BaseModel):
    test_id: str
    answers: List[AnswerItem]
    candidate: CandidateInfo


class TestResultResponse(BaseModel):
    percent: int
    verdict: str

class AreaItem(BaseModel):
    category: str

class CategoryBreakdownItem(BaseModel):
    category: str
    correct: int
    total: int
    percent: int

class TestResultResponse(BaseModel):
    percent: int
    verdict: str
    strong_areas: list[AreaItem] = []
    weak_areas: list[AreaItem] = []
    categories: list[CategoryBreakdownItem] = []

class CompanyPlan(BaseModel):
    plan_name: str
    tests_limit: int | None = None
    tests_used: int
    subscription_expires_at: datetime | None = None
    is_trial: bool

    class Config:
        orm_mode = True