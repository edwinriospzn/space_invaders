import logging
from datetime import datetime

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.sdk import DAG, task

logger = logging.getLogger(__name__)


@task
def extract_telemetry_events():
    hook = PostgresHook(postgres_conn_id="telemetry_postgres")
    count = hook.get_first("SELECT COUNT(*) FROM telemetry_events")[0]
    logger.info("telemetry_events row count: %s", count)


with DAG(
    dag_id="extract_telemetry",
    description="Reads telemetry_events from PostgreSQL and prints the row count.",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["sprint-4", "extract"],
) as dag:
    extract_telemetry_events()
