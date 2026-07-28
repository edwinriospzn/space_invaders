# Build context: backend/api
# docker build -f infrastructure/docker/backend/Dockerfile -t space-invaders-api backend/api

FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV API_PORT=8000

EXPOSE ${API_PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${API_PORT}/health', timeout=3)" || exit 1

ENTRYPOINT uvicorn app.main:app --host 0.0.0.0 --port ${API_PORT}
