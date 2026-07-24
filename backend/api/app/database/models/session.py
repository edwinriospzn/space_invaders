import uuid

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.database.base import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True)
    session_uuid = Column(String, unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    result = Column(String, nullable=True)
    score = Column(Integer, nullable=True)

    telemetry_events = relationship("TelemetryEvent", back_populates="session")
