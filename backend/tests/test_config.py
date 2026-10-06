"""Production settings refuse development secrets."""
import pytest
from pydantic import ValidationError
from app.core.config import Settings, DEFAULT_SECRET


def test_production_refuses_default_secret():
    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY=DEFAULT_SECRET, _env_file=None)


def test_production_refuses_short_secret():
    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY="short", _env_file=None)


def test_production_turns_debug_off():
    s = Settings(ENVIRONMENT="production", SECRET_KEY="x" * 40, DEBUG=True, _env_file=None)
    assert s.DEBUG is False and s.is_production


def test_development_keeps_defaults():
    s = Settings(_env_file=None)
    assert not s.is_production and s.SECRET_KEY == DEFAULT_SECRET


def test_account_seeding_script_imports():
    """The start-up script that creates the accounts must at least load (it runs at every deploy)."""
    import importlib
    module = importlib.import_module("app.utils.create_admin")
    assert callable(module.seed_production) and callable(module.create_admin)
