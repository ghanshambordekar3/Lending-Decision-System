from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
import re


class BusinessProfile(BaseModel):
    owner_name: str
    pan: str
    business_type: str  # retail | manufacturing | services | other
    monthly_revenue: float

    @field_validator("owner_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Owner name cannot be empty")
        return v.strip()

    @field_validator("pan")
    @classmethod
    def validate_pan(cls, v):
        # PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
        if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", v.upper()):
            raise ValueError("Invalid PAN format. Expected: ABCDE1234F")
        return v.upper()

    @field_validator("business_type")
    @classmethod
    def validate_business_type(cls, v):
        allowed = {"retail", "manufacturing", "services", "other"}
        if v.lower() not in allowed:
            raise ValueError(f"business_type must be one of {allowed}")
        return v.lower()

    @field_validator("monthly_revenue")
    @classmethod
    def revenue_positive(cls, v):
        if v <= 0:
            raise ValueError("Monthly revenue must be positive")
        return v


class LoanApplication(BaseModel):
    loan_amount: float
    tenure_months: int
    purpose: str

    @field_validator("loan_amount")
    @classmethod
    def loan_positive(cls, v):
        if v <= 0:
            raise ValueError("Loan amount must be positive")
        return v

    @field_validator("tenure_months")
    @classmethod
    def tenure_valid(cls, v):
        if v < 1 or v > 360:
            raise ValueError("Tenure must be between 1 and 360 months")
        return v

    @field_validator("purpose")
    @classmethod
    def purpose_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Loan purpose cannot be empty")
        return v.strip()


class FullApplication(BaseModel):
    profile: BusinessProfile
    loan: LoanApplication


class DecisionResponse(BaseModel):
    application_id: str
    status: str          # "Approved" | "Rejected" | "Processing"
    credit_score: Optional[int] = None
    reason_codes: list[str] = []
    emi: Optional[float] = None
    message: str


class AsyncDecisionResponse(BaseModel):
    application_id: str
    status: str          # "pending" | "processing" | "completed"
    poll_url: str
