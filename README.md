# MSME Lending Decision System

A full-stack, end-to-end lending decision platform for MSMEs. Accepts business profiles and loan inputs, runs them through a custom credit engine, and returns a structured decision with score and reason codes.

---

## Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Backend   | Python 3.12, FastAPI, Pydantic v2 |
| Frontend  | React 18, Vite, Framer Motion     |
| Container | Docker + Docker Compose           |

---

## Quick Start

### Option A — Docker Compose (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:8000  
- API Docs (Swagger): http://localhost:8000/docs

### Option B — Local Dev

**Backend**
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## API Reference

### POST `/api/decision`
Synchronous credit decision.

**Request body:**
```json
{
  "profile": {
    "owner_name": "Rajesh Kumar",
    "pan": "ABCDE1234F",
    "business_type": "retail",
    "monthly_revenue": 500000
  },
  "loan": {
    "loan_amount": 2000000,
    "tenure_months": 24,
    "purpose": "Working Capital"
  }
}
```

**Response:**
```json
{
  "application_id": "uuid",
  "status": "Approved",
  "credit_score": 72,
  "reason_codes": [],
  "emi": 99556.45,
  "message": "Decision: Approved. Credit Score: 72/100."
}
```

---

### POST `/api/decision/async`
Submits application for async processing (simulates background job). Returns `202 Accepted`.

**Response:**
```json
{
  "application_id": "uuid",
  "status": "pending",
  "poll_url": "http://localhost:8000/api/decision/status/<id>"
}
```

### GET `/api/decision/status/{application_id}`
Poll for async decision result. Status transitions: `pending → processing → completed`.

### GET `/api/audit?application_id=<optional>`
Returns full audit trail. Filter by `application_id` or omit for all entries.

### GET `/health`
Returns `{"status": "ok"}`.

---

## Decision Logic

### Scoring Model (0–100 scale)

| Signal                  | Max Points | Description                                      |
|-------------------------|-----------|--------------------------------------------------|
| Revenue-to-EMI Ratio    | 35        | Monthly revenue vs estimated monthly EMI         |
| Loan-to-Revenue Multiple| 25        | Loan amount as a multiple of monthly revenue     |
| Tenure Risk             | 20        | Penalty for very short (<6m) or very long (>84m) |
| Business Type           | 10        | Risk proxy by sector                             |
| Fraud / Consistency     | 10        | Hard cap if extreme mismatch detected            |

**Approval threshold: score ≥ 50**

### Revenue-to-EMI Scoring (35 pts)
| Ratio (Revenue / EMI) | Score |
|-----------------------|-------|
| ≥ 3.0×                | 35    |
| ≥ 2.0×                | 25    |
| ≥ 1.5×                | 15    |
| ≥ 1.2×                | 8     |
| < 1.2×                | 0 + `LOW_REVENUE` |

### Loan Multiple Scoring (25 pts)
| Loan / Monthly Revenue | Score |
|------------------------|-------|
| ≤ 6×                   | 25    |
| ≤ 12×                  | 18    |
| ≤ 18×                  | 10    |
| ≤ 30×                  | 4     |
| > 30×                  | 0 + `HIGH_LOAN_RATIO` |

### Tenure Scoring (20 pts)
| Tenure Band     | Score |
|-----------------|-------|
| 12–60 months    | 20    |
| 6–11 months     | 12    |
| < 6 months      | 5 + `TENURE_TOO_SHORT` |
| 61–84 months    | 15    |
| > 84 months     | 8 + `TENURE_TOO_LONG` |

### Business Type (10 pts)
| Type          | Score |
|---------------|-------|
| Manufacturing | 10    |
| Services      | 9     |
| Retail        | 7     |
| Other         | 6     |

### Fraud Check
If `loan_amount > 50× monthly_revenue` → `DATA_INCONSISTENCY` flag + score hard-capped at 30 → auto-rejected.

### Interest Rate Assumption
Flat **18% p.a.** (typical unsecured MSME lending rate in India).  
EMI formula: `P × r × (1+r)^n / ((1+r)^n - 1)` where `r = 0.18/12`.

---

## Reason Codes

| Code                  | Meaning                                          |
|-----------------------|--------------------------------------------------|
| `LOW_REVENUE`         | Revenue insufficient to service EMI              |
| `HIGH_LOAN_RATIO`     | Loan amount too high relative to monthly revenue |
| `TENURE_TOO_SHORT`    | Tenure < 6 months — high repayment stress        |
| `TENURE_TOO_LONG`     | Tenure > 84 months — elevated long-term risk     |
| `DATA_INCONSISTENCY`  | Loan > 50× revenue — likely data error or fraud  |
| `SCORE_BELOW_THRESHOLD` | Score < 50 with no other specific flag         |

---

## Edge Case Handling

| Scenario                              | Handling                                              |
|---------------------------------------|-------------------------------------------------------|
| Missing fields                        | Pydantic validation → 422 with field-level errors     |
| Negative revenue / loan amount        | Validator rejects with descriptive message            |
| Invalid PAN format                    | Regex check: must match `[A-Z]{5}[0-9]{4}[A-Z]`      |
| Non-numeric values                    | Pydantic type coercion fails → 422 error              |
| ₹10L revenue + ₹5Cr loan             | `DATA_INCONSISTENCY` flag, score capped at 30         |
| Tenure = 0 or > 360                   | Validator rejects with range message                  |
| Rate limit exceeded                   | 429 with `RATE_LIMIT_EXCEEDED` error code             |

---

## Bonus Features Implemented

- **Async processing** — `/api/decision/async` with status polling
- **Audit trail** — all submissions and decisions logged to `audit_log.jsonl`
- **API validation middleware** — Pydantic v2 with structured 422 responses
- **Rate limiting** — 10 requests/minute per IP on decision endpoints
- **Docker Compose** — single command local setup

---

## Assumptions

1. Interest rate fixed at 18% p.a. — representative of unsecured MSME loans in India.
2. PAN validation uses standard Indian format (mock — no external verification).
3. Business type is a weak signal; stronger signals (GST data, bank statements) would replace it in production.
4. Async job state is in-memory — a production system would use Redis/Celery.
5. Audit log is a local JSONL file — production would use a database or CloudWatch.
6. No authentication - a production system would require OAuth2/API keys.
