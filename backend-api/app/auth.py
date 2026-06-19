# auth.py
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError  # pip install "python-jose[cryptography]"
from sqlalchemy.orm import Session

from .database import SessionLocal
from . import models

from pwdlib import PasswordHash


password_hasher = PasswordHash.recommended()

# --- Пароли ---
def get_password_hash(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hasher.verify(plain_password, hashed_password)


# --- JWT-настройки ---
SECRET_KEY = "CHANGE_ME_TO_LONG_RANDOM_SECRET"  # вынеси в env на проде
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 день


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)

    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = now + expires_delta
    to_encode.update({"exp": expire, "iat": now})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Текущая компания из токена ---
def get_current_company(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.Company:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        company_id: int | None = payload.get("company_id")
        if company_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    company = (
        db.query(models.Company)
        .filter(models.Company.id == company_id)
        .first()
    )
    if company is None:
        raise credentials_exception

    return company