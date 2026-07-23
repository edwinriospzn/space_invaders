from fastapi import APIRouter, Depends

from app.dependencies.telemetry import get_telemetry_service
from app.models.telemetry import TelemetryBatch
from app.services.telemetry_service import TelemetryService

router = APIRouter()


@router.post("/telemetry")
async def receive_telemetry(
    batch: TelemetryBatch,
    service: TelemetryService = Depends(get_telemetry_service)
):
    received = service.ingest_batch(batch)
    return {"received": received}
