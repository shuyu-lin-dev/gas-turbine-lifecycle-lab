FROM ghcr.io/astral-sh/uv:0.9.7@sha256:ba4857bf2a068e9bc0e64eed8563b065908a4cd6bfb66b531a9c424c8e25e142 AS uv
FROM python:3.12.12-slim-bookworm@sha256:593bd06efe90efa80dc4eee3948be7c0fde4134606dd40d8dd8dbcade98e669c
COPY --from=uv /uv /usr/local/bin/uv
WORKDIR /app
ENV UV_PYTHON_DOWNLOADS=never \
    UV_CACHE_DIR=/app/.scratch-runtime/uv-cache \
    TMPDIR=/app/.scratch-runtime/tmp \
    PYTHONDONTWRITEBYTECODE=1
RUN mkdir -p /app/.scratch-runtime/tmp
COPY pyproject.toml uv.lock ./
COPY src ./src
RUN uv build && uv sync --locked --no-dev --no-editable
EXPOSE 8000
CMD [".venv/bin/uvicorn", "gt_lifecycle_api.app:app", "--host", "0.0.0.0", "--port", "8000"]
