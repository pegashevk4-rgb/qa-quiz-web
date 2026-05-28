from pydantic import BaseModel, EmailStr

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
    email: EmailStr
    name: str
    company_id: int
    role: str

    class Config:
        from_attributes = True
