# Build context: backend/api
# docker build -f infrastructure/docker/backend/Dockerfile -t space-invaders-api backend/api

FROM python:3.13-slim AS build

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.13-slim

WORKDIR /app

COPY --from=build /install /usr/local
COPY . .

ENV API_PORT=8000

EXPOSE ${API_PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${API_PORT}/health', timeout=3)" || exit 1

ENTRYPOINT uvicorn app.main:app --host 0.0.0.0 --port ${API_PORT}
