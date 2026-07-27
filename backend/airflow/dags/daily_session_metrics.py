import logging
from datetime import datetime

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.sdk import DAG, task

logger = logging.getLogger(__name__)


@task
def create_analytics_schema():
    hook = PostgresHook(postgres_conn_id="telemetry_postgres")
    hook.run("CREATE SCHEMA IF NOT EXISTS analytics")
    hook.run(
        """
        CREATE TABLE IF NOT EXISTS analytics.daily_sessions (
            session_id INTEGER PRIMARY KEY,
            duration_seconds NUMERIC,
            score INTEGER,
            event_count INTEGER
        )
        """
    )


@task
def build_daily_sessions():
    hook = PostgresHook(postgres_conn_id="telemetry_postgres")
    hook.run(
        """
        INSERT INTO analytics.daily_sessions (session_id, duration_seconds, score, event_count)
        SELECT
            s.id AS session_id,
            EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) AS duration_seconds,
            s.score,
            COUNT(te.id) AS event_count
        FROM sessions s
        LEFT JOIN telemetry_events te ON te.session_id = s.id
        GROUP BY s.id, s.started_at, s.ended_at, s.score
        ON CONFLICT (session_id) DO UPDATE SET
            duration_seconds = EXCLUDED.duration_seconds,
            score = EXCLUDED.score,
            event_count = EXCLUDED.event_count
        """
    )
    logger.info("analytics.daily_sessions rebuilt")


with DAG(
    dag_id="daily_session_metrics",
    description="Groups telemetry_events by session to compute duration, score and event_count into analytics.daily_sessions.",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["sprint-4", "etl"],
) as dag:
    create_analytics_schema() >> build_daily_sessions()
