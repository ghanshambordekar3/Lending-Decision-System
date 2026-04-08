"""
Credit Decision Engine
======================

Scoring Model (0–100 scale):

SIGNAL                          WEIGHT   DESCRIPTION
------                          ------   -----------
Revenue-to-EMI Ratio            35 pts   Monthly revenue vs estimated EMI
Loan-to-Revenue Multiple        25 pts   Loan amount as X× monthly revenue
Tenure Risk                     20 pts   Penalty for very short (<6m) or very long (>84m) tenures
Business Type Risk              10 pts   Manufacturing/services slightly lower risk than retail
Fraud / Consistency Check       10 pts   Flags extreme mismatches

THRESHOLDS
----------
- Approval threshold: credit_score >= 50
- Revenue-to-EMI: ratio >= 3.0 → full 35 pts; < 1.2 → 0 pts (can't afford EMI)
- Loan multiple: <= 6× monthly revenue → full 25 pts; > 30× → 0 pts
- Tenure: 12–60 months is ideal band; outside penalised linearly
- Fraud flag: loan > 50× monthly revenue → DATA_INCONSISTENCY

INTEREST RATE ASSUMPTION
------------------------
Flat rate of 18% p.a. used for EMI calculation (typical MSME unsecured lending rate).
EMI = P × r × (1+r)^n / ((1+r)^n - 1)  where r = monthly rate
"""

from dataclasses import dataclass
from models import BusinessProfile, LoanApplication

ANNUAL_INTEREST_RATE = 0.18
APPROVAL_THRESHOLD = 50

BUSINESS_TYPE_SCORE = {
    "manufacturing": 10,
    "services": 9,
    "retail": 7,
    "other": 6,
}


@dataclass
class ScoringResult:
    credit_score: int
    decision: str
    reason_codes: list
    emi: float
    breakdown: dict


def compute_emi(principal: float, tenure_months: int) -> float:
    r = ANNUAL_INTEREST_RATE / 12
    emi = principal * r * (1 + r) ** tenure_months / ((1 + r) ** tenure_months - 1)
    return round(emi, 2)


def score_revenue_to_emi(monthly_revenue: float, emi: float) -> tuple[float, list]:
    """35 pts — can the business afford the EMI?"""
    reason_codes = []
    if emi <= 0:
        return 0, reason_codes
    ratio = monthly_revenue / emi
    if ratio >= 3.0:
        score = 35
    elif ratio >= 2.0:
        score = 25
    elif ratio >= 1.5:
        score = 15
    elif ratio >= 1.2:
        score = 8
    else:
        score = 0
        reason_codes.append("LOW_REVENUE")
    return score, reason_codes


def score_loan_multiple(loan_amount: float, monthly_revenue: float) -> tuple[float, list]:
    """25 pts — loan as a multiple of monthly revenue"""
    reason_codes = []
    multiple = loan_amount / monthly_revenue
    if multiple <= 6:
        score = 25
    elif multiple <= 12:
        score = 18
    elif multiple <= 18:
        score = 10
    elif multiple <= 30:
        score = 4
    else:
        score = 0
        reason_codes.append("HIGH_LOAN_RATIO")
    return score, reason_codes


def score_tenure(tenure_months: int) -> tuple[float, list]:
    """20 pts — ideal band is 12–60 months"""
    reason_codes = []
    if 12 <= tenure_months <= 60:
        score = 20
    elif tenure_months < 6:
        score = 5
        reason_codes.append("TENURE_TOO_SHORT")
    elif tenure_months < 12:
        score = 12
    elif tenure_months <= 84:
        score = 15
    else:
        score = 8
        reason_codes.append("TENURE_TOO_LONG")
    return score, reason_codes


def score_business_type(business_type: str) -> float:
    """10 pts — business type risk proxy"""
    return BUSINESS_TYPE_SCORE.get(business_type, 6)


def fraud_check(loan_amount: float, monthly_revenue: float) -> list:
    """Flags extreme mismatches"""
    reason_codes = []
    multiple = loan_amount / monthly_revenue
    if multiple > 50:
        reason_codes.append("DATA_INCONSISTENCY")
    return reason_codes


def run_decision(profile: BusinessProfile, loan: LoanApplication) -> ScoringResult:
    emi = compute_emi(loan.loan_amount, loan.tenure_months)
    all_reasons = []

    s_emi, r1 = score_revenue_to_emi(profile.monthly_revenue, emi)
    s_loan, r2 = score_loan_multiple(loan.loan_amount, profile.monthly_revenue)
    s_tenure, r3 = score_tenure(loan.tenure_months)
    s_biz = score_business_type(profile.business_type)
    r_fraud = fraud_check(loan.loan_amount, profile.monthly_revenue)

    all_reasons = r1 + r2 + r3 + r_fraud

    raw_score = s_emi + s_loan + s_tenure + s_biz
    # Fraud check hard-caps score
    if "DATA_INCONSISTENCY" in all_reasons:
        raw_score = min(raw_score, 30)

    credit_score = max(0, min(100, int(raw_score)))
    decision = "Approved" if credit_score >= APPROVAL_THRESHOLD and not r_fraud else "Rejected"

    if not all_reasons and decision == "Rejected":
        all_reasons.append("SCORE_BELOW_THRESHOLD")

    return ScoringResult(
        credit_score=credit_score,
        decision=decision,
        reason_codes=list(set(all_reasons)),
        emi=emi,
        breakdown={
            "revenue_to_emi_score": s_emi,
            "loan_multiple_score": s_loan,
            "tenure_score": s_tenure,
            "business_type_score": s_biz,
        },
    )
