from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

DEFAULT_SECRET = "change-this-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # App
    APP_NAME: str = "AI Medical Assistant"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = DEFAULT_SECRET
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ai_medical_db"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Uploads (profile photos, doctor verification documents) — stored in the database
    AVATAR_MAX_BYTES: int = 2 * 1024 * 1024
    DOCUMENT_MAX_BYTES: int = 5 * 1024 * 1024

    # ML
    ML_MODEL_PATH: str = "ml/models/saved/model.joblib"

    # AI chat (optional — enables the language-model assistant and free-text symptom reading)
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-opus-5-5"
    CLAUDE_CHAT_EFFORT: str = "low"          # low | medium | high — low keeps replies fast and cheap
    CLAUDE_TIMEOUT_SECONDS: float = 60.0

    # Demo accounts. In production only the admin is created (from ADMIN_EMAIL /
    # ADMIN_PASSWORD); set DEMO_ACCOUNTS=true to also create the demo patient.
    DEMO_ACCOUNTS: bool = False

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @model_validator(mode="after")
    def _safe_for_production(self):
        """Refuse to start a production server with development secrets."""
        if self.is_production:
            if self.SECRET_KEY == DEFAULT_SECRET or len(self.SECRET_KEY) < 32:
                raise ValueError("Set a random SECRET_KEY of at least 32 characters for production")
            self.DEBUG = False
        return self


settings = Settings()
