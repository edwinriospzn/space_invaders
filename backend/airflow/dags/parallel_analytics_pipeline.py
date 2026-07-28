import logging
from datetime import datetime

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.sdk import DAG, task

logger = logging.getLogger(__name__)


@task
def extract():
    hook = PostgresHook(postgres_conn_id="telemetry_postgres")
    session_rows = hook.get_records(
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
    event_rows = hook.get_records(
        """
        SELECT
            te.timestamp::date AS event_date,
            te.event_type,
            COUNT(*) AS total_events
        FROM telemetry_events te
        GROUP BY te.timestamp::date, te.event_type
        """
    )
    return {"session_rows": session_rows, "event_rows": event_rows}


@task
def session_etl(extracted):
    records = []
    for session_id, started_at, ended_at, score, event_count in extracted["session_rows"]:
        duration_seconds = (ended_at - started_at).total_seconds() if started_at and ended_at else None
        records.append((session_id, duration_seconds, score, event_count))

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
    return len(records)


@task
def event_etl(extracted):
    records = extracted["event_rows"]

    hook = PostgresHook(postgres_conn_id="telemetry_postgres")
    hook.run("CREATE SCHEMA IF NOT EXISTS analytics")
    hook.run(
        """
        CREATE TABLE IF NOT EXISTS analytics.event_statistics (
            event_date DATE NOT NULL,
            event_type TEXT NOT NULL,
            total_events INTEGER NOT NULL,
            PRIMARY KEY (event_date, event_type)
        )
        """
    )
    hook.insert_rows(
        table="analytics.event_statistics",
        rows=records,
        target_fields=["event_date", "event_type", "total_events"],
        replace=True,
        replace_index=["event_date", "event_type"],
    )
    logger.info("analytics.event_statistics rebuilt: %s rows", len(records))
    return len(records)


@task
def validate(session_row_count, event_row_count):
    logger.info(
        "Validation: analytics.daily_sessions=%s rows, analytics.event_statistics=%s rows",
        session_row_count,
        event_row_count,
    )
    if session_row_count == 0 or event_row_count == 0:
        raise ValueError("Parallel analytics pipeline produced no rows in one or more tables")


with DAG(
    dag_id="parallel_analytics_pipeline",
    description="Runs session and event ETL branches in parallel after a shared extract, then validates both loads.",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["sprint-4", "etl"],
) as dag:
    extracted = extract()
    validate(session_etl(extracted), event_etl(extracted))
