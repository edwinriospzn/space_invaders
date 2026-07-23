from typing import List

from app.models.telemetry import TelemetryEvent


class TelemetryRepository:

    def __init__(self):
        self._events: List[TelemetryEvent] = []

    def save(self, event: TelemetryEvent):
        self._events.append(event)

    def save_many(self, events: List[TelemetryEvent]):
        self._events.extend(events)

    def get_all(self) -> List[TelemetryEvent]:
        return self._events

    def clear(self):
        self._events = []
