from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from . import models, schemas
from .auth import get_password_hash, verify_password

# Временно без авто-создания таблиц, ты уже создал их в Neon
# Base.metadata.create_all(bind=engine)

app = FastAPI()


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