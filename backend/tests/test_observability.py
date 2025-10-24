from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"


def test_metrics_endpoint():
    response = client.get("/metrics")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "details" in payload
