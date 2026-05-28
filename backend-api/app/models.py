from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
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


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    public_token = Column(String(255), unique=True, nullable=True)

    # подписка / лимиты
    is_paid = Column(Boolean, default=False)              # платная подписка или нет
    trial_tests_limit = Column(Integer, default=10)       # лимит тестов на триал
    trial_tests_used = Column(Integer, default=0)         # сколько уже использовали

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"))

    company = relationship("Company", backref="users")


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    test_id = Column(String(50), nullable=False)
    total_score = Column(Numeric(5, 2), nullable=False)
    max_score = Column(Numeric(5, 2), nullable=False)
    percent = Column(Integer, nullable=False)
    verdict = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"))

    user = relationship("User", backref="results")
    company = relationship("Company", backref="results")


class DetailedResult(Base):
    __tablename__ = "detailed_results"

    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("results.id", ondelete="CASCADE"))
    category = Column(String(100), nullable=False)
    percent = Column(Integer, nullable=False)
    is_strong = Column(Boolean, default=False)
    is_weak = Column(Boolean, default=False)

    result = relationship("Result", backref="details")