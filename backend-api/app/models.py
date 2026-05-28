from sqlalchemy import Column, Integer, String, DateTime, func
from .database import Base


class CompanyHRUser(Base):
    __tablename__ = "company_hr_users"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="manager")
    created_at = Column(DateTime(timezone=False), server_default=func.now())