from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_valid_telemetry_is_accepted():
    response = client.post(
        "/telemetry",
        json={
            "sessionId": "session-123",
            "events": [
                {
                    "eventType": "GAME_START",
                    "timestamp": "2026-07-23T10:00:00.000Z",
                    "sessionId": "session-123",
                    "payload": {}
                },
                {
                    "eventType": "PLAYER_SHOT",
                    "timestamp": "2026-07-23T10:00:01.000Z",
                    "sessionId": "session-123",
                    "payload": {"x": 120, "y": 300}
                }
            ]
        }
    )

    assert response.status_code == 200
    assert response.json() == {"received": 2}


def test_telemetry_missing_events_is_rejected():
    response = client.post(
        "/telemetry",
        json={"sessionId": "session-123"}
    )

    assert response.status_code == 422
    assert response.json() == {"error": "Invalid telemetry payload"}


def test_telemetry_empty_events_is_rejected():
    response = client.post(
        "/telemetry",
        json={"sessionId": "session-123", "events": []}
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": "Telemetry batch must contain at least one event"
    }
