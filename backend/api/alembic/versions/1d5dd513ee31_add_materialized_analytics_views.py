"""add materialized analytics views

Revision ID: 1d5dd513ee31
Revises: 8e2c45c4b257
Create Date: 2026-07-24 14:28:39.430458

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1d5dd513ee31'
down_revision: Union[str, Sequence[str], None] = '8e2c45c4b257'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        CREATE MATERIALIZED VIEW daily_sessions AS
        SELECT
            started_at::date AS day,
            COUNT(*) AS session_count
        FROM sessions
        GROUP BY started_at::date
    """)
    op.execute(
        "CREATE UNIQUE INDEX ix_daily_sessions_day ON daily_sessions (day)"
    )

    op.execute("""
        CREATE MATERIALIZED VIEW daily_scores AS
        SELECT
            started_at::date AS day,
            AVG(score) AS avg_score,
            MAX(score) AS max_score
        FROM sessions
        WHERE score IS NOT NULL
        GROUP BY started_at::date
    """)
    op.execute(
        "CREATE UNIQUE INDEX ix_daily_scores_day ON daily_scores (day)"
    )

    op.execute("""
        CREATE MATERIALIZED VIEW event_counts AS
        SELECT
            timestamp::date AS day,
            event_type,
            COUNT(*) AS count
        FROM telemetry_events
        GROUP BY timestamp::date, event_type
    """)
    op.execute(
        "CREATE UNIQUE INDEX ix_event_counts_day_event_type "
        "ON event_counts (day, event_type)"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP MATERIALIZED VIEW IF EXISTS event_counts")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS daily_scores")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS daily_sessions")
