import logging
from datetime import datetime

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.standard.operators.python import PythonOperator
from airflow.sdk import DAG

logger = logging.getLogger(__name__)


def check_connection():
    hook = PostgresHook(postgres_conn_id="telemetry_postgres")
    result = hook.get_first("SELECT 1")
    logger.info("telemetry_postgres connection check returned: %s", result)


with DAG(
    dag_id="check_telemetry_connection",
    description="Verifies Airflow can reach the telemetry PostgreSQL database via the telemetry_postgres connection.",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["sprint-4", "smoke-test"],
) as dag:
    check = PythonOperator(task_id="check_connection", python_callable=check_connection)
