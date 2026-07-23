from typing import List

from app.core.logging import logger
from app.models.telemetry import TelemetryBatch, TelemetryEvent
from app.repositories.telemetry_repository import TelemetryRepository


class TelemetryService:

    def __init__(self, repository: TelemetryRepository):
        self.repository = repository

    def ingest_batch(self, batch: TelemetryBatch) -> int:
        if not batch.events:
            raise ValueError("Telemetry batch must contain at least one event")

        for event in batch.events:
            if event.sessionId != batch.sessionId:
                raise ValueError("Event sessionId does not match batch sessionId")

        self.repository.save_many(batch.events)

        logger.info(
            "Ingested %s telemetry event(s) for session %s",
            len(batch.events),
            batch.sessionId
        )

        return len(batch.events)

    def get_all_events(self) -> List[TelemetryEvent]:
        return self.repository.get_all()
