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
def extract_telemetry_events():
    hook = PostgresHook(postgres_conn_id="telemetry_postgres")
    count = hook.get_first("SELECT COUNT(*) FROM telemetry_events")[0]
    logger.info("telemetry_events row count: %s", count)


with DAG(
    dag_id="extract_telemetry",
    description="Reads telemetry_events from PostgreSQL and prints the row count.",
    start_date=datetime(2026, 1, 1),
    schedule="@hourly",
    catchup=False,
    default_args=default_args,
    tags=["sprint-4", "extract"],
) as dag:
    dag.doc_md = """
    ### Extract Telemetry

    Smoke-checks connectivity by reading the `telemetry_events` row count
    from PostgreSQL and logging it.

    Retries twice with a 5 minute delay between attempts. On failure,
    `notify_failure` logs the dag/task/run and exception (log only for now).
    """
    extract_telemetry_events()
