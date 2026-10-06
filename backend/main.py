from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.schemas.analysis import SymptomTextIn, SymptomExtractionOut
from app.api.routes import auth, users, analysis, reports, doctor, admin, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load the ML model at startup so first request is fast
    try:
        from app.services.ml_service import get_all_symptoms
        symptoms = get_all_symptoms()
        print(f"ML model loaded — {len(symptoms)} features ready")
    except Exception as e:
        print(f"ML model not loaded (train first): {e}")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(users.files_router)
app.include_router(analysis.router)
app.include_router(reports.router)
app.include_router(doctor.router)
app.include_router(admin.router)
app.include_router(chat.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": settings.VERSION}


@app.get("/api/symptoms")
def list_symptoms():
    """Return the full list of known symptoms for the frontend selector."""
    try:
        from app.services.ml_service import get_all_symptoms
        return {"symptoms": get_all_symptoms()}
    except Exception:
        return {"symptoms": []}


@app.get("/api/diseases")
def list_diseases():
    """Every disease the model knows, with its specialist and base urgency."""
    try:
        from app.services.ml_service import list_diseases as diseases
        return {"diseases": diseases()}
    except Exception:
        return {"diseases": []}


@app.post("/api/symptoms/extract", response_model=SymptomExtractionOut)
def extract_symptoms(data: SymptomTextIn):
    """Turn a free-text description (English or French) into known symptom names."""
    from app.services.ml_service import extract_symptoms as extract
    return extract(data.text)
