import logging
from datetime import datetime, timedelta

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.sdk import DAG, task

logger = logging.getLogger(__name__)


def notify_failure(context):
    logger.error(
        "Task failed: dag_id=%s task_id=%s run_id=%s exception=%s",
        context["dag"].dag_id,
        context["task_instance"].task_id,
        context["run_id"],
        context.get("exception"),
    )


default_args = {
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "on_failure_callback": notify_failure,
}


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
    default_args=default_args,
    tags=["sprint-4", "etl"],
) as dag:
    dag.doc_md = """
    ### Event Statistics

    Aggregates `telemetry_events` by event date and event type into
    `analytics.event_statistics`.

    Retries twice with a 5 minute delay between attempts. On failure,
    `notify_failure` logs the dag/task/run and exception (log only for now).
    """
    create_event_statistics_table() >> build_event_statistics()
