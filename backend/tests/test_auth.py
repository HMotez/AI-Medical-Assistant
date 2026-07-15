import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from main import app

TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


REGISTER_PAYLOAD = {
    "email": "test@example.com",
    "password": "secret123",
    "full_name": "Test User",
    "age": 30,
    "gender": "male",
}


def test_register(client):
    res = client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "patient"
    assert "hashed_password" not in data


def test_register_duplicate_email(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    res = client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert res.status_code == 400


def test_login(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    res = client.post("/api/auth/login", json={"email": "test@example.com", "password": "secret123"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    res = client.post("/api/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert res.status_code == 401


def test_get_me(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "secret123"})
    token = login.json()["access_token"]
    res = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "test@example.com"


def test_update_me(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "secret123"})
    token = login.json()["access_token"]
    res = client.put("/api/users/me", json={"full_name": "Updated Name"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["full_name"] == "Updated Name"


def test_delete_me(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "secret123"})
    token = login.json()["access_token"]
    res = client.delete("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 204
    # Deleted user can no longer access protected routes
    res2 = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 401


def test_unauthorized_without_token(client):
    res = client.get("/api/users/me")
    assert res.status_code in (401, 403)
