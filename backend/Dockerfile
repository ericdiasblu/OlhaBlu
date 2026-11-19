FROM python:3.13.5-slim-bookworm AS dependencies

WORKDIR /build
COPY backend/requirements.txt ./requirements.txt
RUN python -m venv --without-pip /opt/venv \
    && python -m pip --python /opt/venv/bin/python install \
        --no-cache-dir --no-compile --only-binary=:all: --require-hashes -r requirements.txt

FROM python:3.13.5-slim-bookworm AS runtime

ENV PATH="/opt/venv/bin:${PATH}" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=production
WORKDIR /app
RUN useradd --no-create-home --uid 10001 app
COPY --from=dependencies /opt/venv /opt/venv
COPY --chown=app:app backend/app ./app
COPY --chown=app:app backend/alembic ./alembic
COPY --chown=app:app backend/alembic.ini ./alembic.ini
USER app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-access-log", "--no-proxy-headers"]
