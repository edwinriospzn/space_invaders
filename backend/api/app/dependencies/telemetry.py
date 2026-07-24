from fastapi import Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.telemetry_repository import TelemetryRepository
from app.services.telemetry_service import TelemetryService


def get_telemetry_repository(db: Session = Depends(get_db)) -> TelemetryRepository:
    return TelemetryRepository(db)


def get_telemetry_service(
    repository: TelemetryRepository = Depends(get_telemetry_repository)
) -> TelemetryService:
    return TelemetryService(repository)
