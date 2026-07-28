import logging

from app.core.config import settings


def setup_logging():
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )


logger = logging.getLogger("app")
