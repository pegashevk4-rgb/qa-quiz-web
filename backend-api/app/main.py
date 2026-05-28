from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from . import models, schemas
from .auth import get_password_hash, verify_password
from fastapi import Path

import secrets
import string

Base.metadata.create_all(bind=engine)

app = FastAPI()

def generate_public_token(length: int = 32) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post(
    "/auth/register",
    response_model=schemas.CompanyHRUserPublic,
    status_code=status.HTTP_201_CREATED,
)
def register_hr_user(payload: schemas.CompanyHRUserCreate, db: Session = Depends(get_db)):
    # Проверяем, что email свободен
    existing = db.query(models.CompanyHRUser).filter(
        models.CompanyHRUser.email == payload.email
    ).first()
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
    return hr_user


@app.post("/auth/login", response_model=schemas.CompanyHRUserPublic)
def login_hr_user(payload: schemas.CompanyHRUserCreate, db: Session = Depends(get_db)):
    hr_user = db.query(models.CompanyHRUser).filter(
        models.CompanyHRUser.email == payload.email
    ).first()
    if not hr_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not verify_password(payload.password, hr_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    return hr_user

@app.post("/companies", response_model=schemas.CompanyPublic, status_code=status.HTTP_201_CREATED)
def create_company(payload: schemas.CompanyCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Company).filter(models.Company.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company with this name already exists")

    public_token = generate_public_token()

    company = models.Company(
        name=payload.name,
        public_token=public_token,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

@app.post("/candidates", response_model=schemas.CandidatePublic, status_code=status.HTTP_201_CREATED)
def create_candidate(payload: schemas.CandidateCreate, db: Session = Depends(get_db)):
    # можно добавить проверку существования компании
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
    candidate = db.query(models.User).filter(models.User.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

@app.post("/results", response_model=schemas.ResultPublic, status_code=status.HTTP_201_CREATED)
def create_result(payload: schemas.ResultCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    company = None
    if payload.company_id:
        company = db.query(models.Company).filter(models.Company.id == payload.company_id).first()
        if not company:
            raise HTTPException(status_code=400, detail="Company not found")

        # Лимит тестов для бесплатной компании
        if not company.is_paid:
            if company.trial_tests_used >= company.trial_tests_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Trial tests limit reached. Please upgrade to a paid plan.",
                )
            # Увеличиваем счётчик использования
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
    result = db.query(models.Result).filter(models.Result.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result

@app.post("/companies/{company_id}/upgrade", response_model=schemas.CompanyPublic)
def upgrade_company(
    company_id: int = Path(...),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if company.is_paid:
        return company  # уже на подписке

    company.is_paid = True
    # Можно сбросить trial_tests_used или оставить как историю
    # company.trial_tests_used = 0

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
    company = db.query(models.Company).filter(
        models.Company.public_token == public_token
    ).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return company