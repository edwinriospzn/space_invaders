from typing import Any, Dict, List

from pydantic import BaseModel


class TelemetryEvent(BaseModel):
    eventType: str
    timestamp: str
    sessionId: str
    payload: Dict[str, Any] = {}


class TelemetryBatch(BaseModel):
    sessionId: str
    events: List[TelemetryEvent]
