FROM python:3.13.5-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 APP_ENV=production
WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --require-hashes -r requirements.txt \
    && useradd --create-home --uid 10001 app
COPY --chown=app:app backend/app ./app
COPY --chown=app:app backend/alembic ./alembic
COPY --chown=app:app backend/alembic.ini ./alembic.ini
USER app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-access-log", "--no-proxy-headers"]
