import logging
from datetime import datetime

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.sdk import DAG, task

logger = logging.getLogger(__name__)


@task
def create_event_statistics_table():
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


@task
def build_event_statistics():
    hook = PostgresHook(postgres_conn_id="telemetry_postgres")
    hook.run(
        """
        INSERT INTO analytics.event_statistics (event_date, event_type, total_events)
        SELECT
            te.timestamp::date AS event_date,
            te.event_type,
            COUNT(*) AS total_events
        FROM telemetry_events te
        GROUP BY te.timestamp::date, te.event_type
        ON CONFLICT (event_date, event_type) DO UPDATE SET
            total_events = EXCLUDED.total_events
        """
    )
    logger.info("analytics.event_statistics rebuilt")


with DAG(
    dag_id="event_statistics",
    description="Aggregates telemetry_events by event_date and event_type into analytics.event_statistics.",
    start_date=datetime(2026, 1, 1),
    schedule="@hourly",
    catchup=False,
    tags=["sprint-4", "etl"],
) as dag:
    create_event_statistics_table() >> build_event_statistics()
