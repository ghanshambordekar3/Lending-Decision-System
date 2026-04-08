import os
import uuid
import asyncio
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import FullApplication, DecisionResponse, AsyncDecisionResponse
from decision_engine import run_decision
from audit import log_event, get_audit_trail

app = FastAPI(title="MSME Lending Decision API", version="1.0.0")

@app.on_event("startup")
async def startup():
    # Verify /tmp is writable
    try:
        test = "/tmp/.render_check"
        with open(test, "w") as f:
            f.write("ok")
        os.remove(test)
    except Exception:
        pass  # non-fatal

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=False,
    max_age=600,
)

# ── In-memory stores ──────────────────────────────────────────────────────────
_async_jobs: dict[str, dict] = {}          # application_id → job state
_rate_limit_store: dict[str, list] = defaultdict(list)

RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW_SECONDS = 60


# ── Rate limiting middleware ──────────────────────────────────────────────────
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if request.url.path.startswith("/api/decision"):
        client_ip = request.client.host
        now = datetime.now(timezone.utc).timestamp()
        window_start = now - RATE_LIMIT_WINDOW_SECONDS
        hits = _rate_limit_store[client_ip]
        _rate_limit_store[client_ip] = [t for t in hits if t > window_start]
        if len(_rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={"error": "RATE_LIMIT_EXCEEDED", "message": "Too many requests. Try again later."},
            )
        _rate_limit_store[client_ip].append(now)
    return await call_next(request)


# ── Structured error handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_ERROR", "message": str(exc)},
    )


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}


# ── Synchronous decision endpoint ─────────────────────────────────────────────
@app.post("/api/decision", response_model=DecisionResponse)
def decide(application: FullApplication):
    application_id = str(uuid.uuid4())
    log_event("APPLICATION_SUBMITTED", application_id, application.model_dump())

    result = run_decision(application.profile, application.loan)

    response = DecisionResponse(
        application_id=application_id,
        status=result.decision,
        credit_score=result.credit_score,
        reason_codes=result.reason_codes,
        emi=result.emi,
        message=f"Decision: {result.decision}. Credit Score: {result.credit_score}/100.",
    )
    log_event("DECISION_ISSUED", application_id, response.model_dump())
    return response


# ── Async decision endpoint ───────────────────────────────────────────────────
@app.post("/api/decision/async", response_model=AsyncDecisionResponse, status_code=202)
async def decide_async(application: FullApplication, request: Request):
    application_id = str(uuid.uuid4())
    log_event("ASYNC_APPLICATION_SUBMITTED", application_id, application.model_dump())

    _async_jobs[application_id] = {"status": "pending", "result": None}

    base_url = str(request.base_url).rstrip("/")
    asyncio.create_task(_process_async(application_id, application))

    return AsyncDecisionResponse(
        application_id=application_id,
        status="pending",
        poll_url=f"{base_url}/api/decision/status/{application_id}",
    )


async def _process_async(application_id: str, application: FullApplication):
    _async_jobs[application_id]["status"] = "processing"
    await asyncio.sleep(3)  # simulate background processing delay
    result = run_decision(application.profile, application.loan)
    _async_jobs[application_id] = {
        "status": "completed",
        "result": {
            "application_id": application_id,
            "status": result.decision,
            "credit_score": result.credit_score,
            "reason_codes": result.reason_codes,
            "emi": result.emi,
            "message": f"Decision: {result.decision}. Credit Score: {result.credit_score}/100.",
        },
    }
    log_event("ASYNC_DECISION_ISSUED", application_id, _async_jobs[application_id]["result"])


@app.get("/api/decision/status/{application_id}")
def poll_status(application_id: str):
    job = _async_jobs.get(application_id)
    if not job:
        raise HTTPException(status_code=404, detail="Application not found")
    if job["status"] == "completed":
        return {"status": "completed", **job["result"]}
    return {"application_id": application_id, "status": job["status"]}


# ── Audit trail endpoint ──────────────────────────────────────────────────────
@app.get("/api/audit")
def audit(application_id: Optional[str] = None):
    return {"entries": get_audit_trail(application_id)}
