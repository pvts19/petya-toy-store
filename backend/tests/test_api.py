from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_catalog_is_public():
    response = client.get("/api/products")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

