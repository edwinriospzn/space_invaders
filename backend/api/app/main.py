from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.api.router import api_router

setup_logging()

app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    debug=settings.debug
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Invalid request payload: %s", exc.errors())
    return JSONResponse(
        status_code=422,
        content={"error": "Invalid telemetry payload"}
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.warning("Invalid request: %s", str(exc))
    return JSONResponse(
        status_code=400,
        content={"error": str(exc)}
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )


@app.on_event("startup")
async def on_startup():
    logger.info("Application startup")


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Application shutdown")
