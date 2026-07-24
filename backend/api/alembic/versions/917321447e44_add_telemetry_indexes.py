"""add telemetry indexes

Revision ID: 917321447e44
Revises: 4be3bc8c42be
Create Date: 2026-07-24 14:22:50.087451

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '917321447e44'
down_revision: Union[str, Sequence[str], None] = '4be3bc8c42be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'sessions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('session_uuid', sa.String(), nullable=False, unique=True),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('result', sa.String(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
    )

    op.create_table(
        'telemetry_events',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('session_id', sa.Integer(), sa.ForeignKey('sessions.id'), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('payload', postgresql.JSONB(), nullable=True),
    )

    # Every ingest batch is scoped to one session and every session detail
    # query fetches its events by session_id, so this FK lookup is the
    # single most frequent filter in the table.
    op.create_index('ix_telemetry_events_session_id', 'telemetry_events', ['session_id'])

    # Analytics (and future Airflow/Spark jobs) filter/group by event type
    # (e.g. counting PLAYER_SHOT vs ENEMY_DESTROYED) far more often than
    # they scan the whole table.
    op.create_index('ix_telemetry_events_event_type', 'telemetry_events', ['event_type'])

    # Telemetry is inherently time-series data: range scans ("events in the
    # last hour", ordering a session's events chronologically) rely on this.
    op.create_index('ix_telemetry_events_timestamp', 'telemetry_events', ['timestamp'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_telemetry_events_timestamp', table_name='telemetry_events')
    op.drop_index('ix_telemetry_events_event_type', table_name='telemetry_events')
    op.drop_index('ix_telemetry_events_session_id', table_name='telemetry_events')
    op.drop_table('telemetry_events')
    op.drop_table('sessions')
