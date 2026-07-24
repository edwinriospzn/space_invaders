from datetime import datetime

from airflow.sdk import DAG
from airflow.providers.standard.operators.empty import EmptyOperator

with DAG(
    dag_id="hello_world",
    description="Does nothing — verifies the Airflow environment runs a DAG successfully.",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["sprint-4", "smoke-test"],
) as dag:
    noop = EmptyOperator(task_id="noop")
