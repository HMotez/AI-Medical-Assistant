from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # App
    APP_NAME: str = "AI Medical Assistant"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ai_medical_db"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # ML
    ML_MODEL_PATH: str = "ml/models/saved/model.joblib"

    # AI Chat (optional — enables Claude-powered assistant and symptom reading)
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-opus-5-5"
    CLAUDE_CHAT_EFFORT: str = "low"          # low | medium | high — low keeps replies fast and cheap
    CLAUDE_TIMEOUT_SECONDS: float = 60.0


settings = Settings()
