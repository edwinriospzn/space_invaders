"""add analytics views

Revision ID: 8e2c45c4b257
Revises: 917321447e44
Create Date: 2026-07-24 14:25:10.166640

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8e2c45c4b257'
down_revision: Union[str, Sequence[str], None] = '917321447e44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        CREATE VIEW events_per_session AS
        SELECT
            sessions.session_uuid AS session_uuid,
            COUNT(telemetry_events.id) AS event_count
        FROM sessions
        LEFT JOIN telemetry_events ON telemetry_events.session_id = sessions.id
        GROUP BY sessions.session_uuid
    """)

    op.execute("""
        CREATE VIEW top_scores AS
        SELECT
            session_uuid,
            score
        FROM sessions
        WHERE score IS NOT NULL
        ORDER BY score DESC
    """)

    op.execute("""
        CREATE VIEW event_frequency AS
        SELECT
            event_type,
            COUNT(*) AS count
        FROM telemetry_events
        GROUP BY event_type
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP VIEW IF EXISTS event_frequency")
    op.execute("DROP VIEW IF EXISTS top_scores")
    op.execute("DROP VIEW IF EXISTS events_per_session")
