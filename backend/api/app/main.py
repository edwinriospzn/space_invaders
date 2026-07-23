from fastapi import FastAPI

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.api.router import api_router

setup_logging()

app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    debug=settings.debug
)

app.include_router(api_router)


@app.on_event("startup")
async def on_startup():
    logger.info("Application startup")


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Application shutdown")
