from unittest.mock import patch

import pytest

from app.database.models.session import Session as SessionModel
from app.database.models.telemetry_event import TelemetryEvent as TelemetryEventModel
from app.models.telemetry import TelemetryEvent
from app.repositories.telemetry_repository import TelemetryRepository


def make_event(event_type, session_id, timestamp, payload=None):
    return TelemetryEvent(
        eventType=event_type,
        timestamp=timestamp,
        sessionId=session_id,
        payload=payload or {},
    )


def test_game_start_creates_session(db_session):
    repository = TelemetryRepository(db_session)

    repository.save(make_event("GAME_START", "session-1", "2026-07-24T10:00:00.000Z"))

    session = db_session.query(SessionModel).filter_by(session_uuid="session-1").first()
    assert session is not None
    assert session.started_at is not None


def test_event_insertion(db_session):
    repository = TelemetryRepository(db_session)

    repository.save(
        make_event("PLAYER_SHOT", "session-2", "2026-07-24T10:00:01.000Z", {"x": 1})
    )

    events = db_session.query(TelemetryEventModel).all()
    assert len(events) == 1
    assert events[0].event_type == "PLAYER_SHOT"
    assert events[0].payload == {"x": 1}


def test_batch_insert(db_session):
    repository = TelemetryRepository(db_session)

    events = [
        make_event("GAME_START", "session-3", "2026-07-24T10:00:00.000Z"),
        make_event("PLAYER_SHOT", "session-3", "2026-07-24T10:00:01.000Z"),
        make_event("PLAYER_SHOT", "session-3", "2026-07-24T10:00:02.000Z"),
    ]

    repository.save_many(events)

    stored = db_session.query(TelemetryEventModel).all()
    assert len(stored) == 3


def test_queries_return_all_events(db_session):
    repository = TelemetryRepository(db_session)

    repository.save_many(
        [
            make_event("GAME_START", "session-4", "2026-07-24T10:00:00.000Z"),
            make_event(
                "GAME_END",
                "session-4",
                "2026-07-24T10:05:00.000Z",
                {"score": 42, "result": "WIN"},
            ),
        ]
    )

    events = repository.get_all()
    assert {event.event_type for event in events} == {"GAME_START", "GAME_END"}

    session = db_session.query(SessionModel).filter_by(session_uuid="session-4").first()
    assert session.score == 42
    assert session.result == "WIN"


def test_save_many_rolls_back_on_error(db_session):
    repository = TelemetryRepository(db_session)

    with patch.object(db_session, "execute", side_effect=RuntimeError("simulated failure")):
        with pytest.raises(RuntimeError):
            repository.save_many(
                [make_event("GAME_START", "session-5", "2026-07-24T10:00:00.000Z")]
            )

    assert db_session.query(SessionModel).filter_by(session_uuid="session-5").first() is None
    assert db_session.query(TelemetryEventModel).count() == 0
