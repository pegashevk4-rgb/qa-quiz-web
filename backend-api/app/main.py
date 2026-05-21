from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from . import models, schemas
from .auth import get_password_hash

# создаём таблицы при запуске
#Base.metadata.create_all(bind=engine)

app = FastAPI()

# зависимость для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/auth/register", response_model=schemas.UserPublic, status_code=status.HTTP_201_CREATED)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    # проверяем, что email свободен
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        name=payload.name,
        company=payload.company,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
