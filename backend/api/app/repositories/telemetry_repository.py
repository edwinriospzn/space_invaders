from datetime import datetime
from typing import List

from sqlalchemy.orm import Session as DBSession

from app.database.models.session import Session
from app.database.models.telemetry_event import TelemetryEvent as TelemetryEventModel
from app.models.telemetry import TelemetryEvent


class TelemetryRepository:

    def __init__(self, db: DBSession):
        self.db = db

    def save(self, event: TelemetryEvent):
        self.save_many([event])

    def save_many(self, events: List[TelemetryEvent]):
        for event in events:
            timestamp = self._parse_timestamp(event.timestamp)
            session = self._get_or_create_session(event.sessionId, timestamp)

            if event.eventType == "GAME_END":
                session.ended_at = timestamp
                session.score = event.payload.get("score")
                session.result = event.payload.get("result")

            self.db.add(
                TelemetryEventModel(
                    session_id=session.id,
                    event_type=event.eventType,
                    timestamp=timestamp,
                    payload=event.payload,
                )
            )
        self.db.commit()

    def get_all(self) -> List[TelemetryEventModel]:
        return self.db.query(TelemetryEventModel).all()

    def clear(self):
        self.db.query(TelemetryEventModel).delete()
        self.db.query(Session).delete()
        self.db.commit()

    def _get_or_create_session(self, session_uuid: str, timestamp: datetime) -> Session:
        session = (
            self.db.query(Session)
            .filter(Session.session_uuid == session_uuid)
            .first()
        )
        if session is None:
            session = Session(session_uuid=session_uuid, started_at=timestamp)
            self.db.add(session)
            self.db.flush()
        return session

    @staticmethod
    def _parse_timestamp(timestamp: str) -> datetime:
        return datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
