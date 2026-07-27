import logging
from datetime import datetime

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.sdk import DAG, task

logger = logging.getLogger(__name__)


@task
def extract():
    hook = PostgresHook(postgres_conn_id="telemetry_postgres")
    return hook.get_records(
        """
        SELECT
            s.id AS session_id,
            s.started_at,
            s.ended_at,
            s.score,
            COUNT(te.id) AS event_count
        FROM sessions s
        LEFT JOIN telemetry_events te ON te.session_id = s.id
        GROUP BY s.id, s.started_at, s.ended_at, s.score
        """
    )


@task
def transform(rows):
    records = []
    for session_id, started_at, ended_at, score, event_count in rows:
        duration_seconds = (ended_at - started_at).total_seconds() if started_at and ended_at else None
        records.append((session_id, duration_seconds, score, event_count))
    return records


@task
def load(records):
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
    hook.insert_rows(
        table="analytics.daily_sessions",
        rows=records,
        target_fields=["session_id", "duration_seconds", "score", "event_count"],
        replace=True,
        replace_index=["session_id"],
    )
    logger.info("analytics.daily_sessions rebuilt: %s rows", len(records))


with DAG(
    dag_id="daily_session_metrics",
    description="Extracts sessions/telemetry_events, transforms duration/score/event_count, and loads analytics.daily_sessions.",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["sprint-4", "etl"],
) as dag:
    load(transform(extract()))
