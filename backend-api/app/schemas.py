from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List


class CompanyHRUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
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
    company_token: str
    access_token: str | None = None
    token_type: str | None = None

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
    type: str = "single"

    class Config:
        from_attributes = True


class TestPublic(BaseModel):
    test_id: str
    title: str
    questions: List[QuestionPublic]


class AnswerItem(BaseModel):
    question_id: int
    selected_index: int | None = None
    selected_indexes: List[int] | None = None


class CandidateInfo(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr | None = None


class TestSubmitWithCandidate(BaseModel):
    test_id: str
    answers: List[AnswerItem]
    candidate: CandidateInfo


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
        from_attributes = True