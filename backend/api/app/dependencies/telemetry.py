from app.repositories.telemetry_repository import TelemetryRepository
from app.services.telemetry_service import TelemetryService

_telemetry_repository = TelemetryRepository()


def get_telemetry_repository() -> TelemetryRepository:
    return _telemetry_repository


def get_telemetry_service() -> TelemetryService:
    return TelemetryService(get_telemetry_repository())
