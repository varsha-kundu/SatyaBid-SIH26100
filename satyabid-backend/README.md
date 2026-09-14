# SIH 2026 — BID COMPLIANCE PLATFORM (Step 1)

This repository contains Step 1: Mock Government Portal & API Integration Layer (mock_portals.py + API).

## Quick Start (local)

1. Copy `.env.example` to `.env` and replace `API_KEY` with a secret:
   ```
   cp .env.example .env
   ```
   Edit `.env` and set `API_KEY` to your own value.

2. Create a virtual environment and install dependencies:

   **Windows (PowerShell / VS Code integrated terminal):**
   ```
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

   **Mac / Linux:**
   ```
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

   You should see `(.venv)` at the start of your terminal prompt once it's active. If it isn't there, dependencies you install won't be found when you run the app.

3. Run the API (with `.venv` still active):
   ```
   python api.py
   ```
   By default the service listens on port 8000. Use header `X-API-KEY` with your `API_KEY` value on every route except `/health`, `/docs`, and `/openapi.json`.

## Docker (quick demo)

1. Build and run:
   ```
   docker-compose up --build
   ```
2. The service will be available at: http://localhost:8000

`.dockerignore` keeps your local `.env`, `.venv/`, and `.git/` out of the image - the container gets its own dependencies from `requirements.txt` and its own `API_KEY` from `docker-compose.yml`'s `environment:` block.

## API Exploration

- OpenAPI (JSON): http://localhost:8000/openapi.json
- Swagger UI: http://localhost:8000/docs

## Security note

- Do NOT commit `.env` to the repository. Use `.env.example` as the template. Add `API_KEY` via environment variables for deployments.
- `.gitignore` and `.dockerignore` both exclude `.venv/` and `.env` - verified with `git check-ignore` so a stray `git add .` or `docker build` won't leak either.

## Testing

Run pytest (with `.venv` active):
```
pytest -v
```

## Files added / fixed in this pass

- `api.py` — CORS `Access-Control-Allow-Methods` now reflects each route's real methods instead of a hardcoded `GET, OPTIONS`, so the `POST /admin/reload-db` endpoint isn't silently blocked by browser preflight requests
- `.gitignore` — fixed a typo (`.envvenv/` → `.venv/`) that meant the virtual environment folder was never actually being ignored
- `.dockerignore` — new; previously nothing stopped `.env`, `.venv/`, or `.git/` from being copied into the Docker image
- `.env.example`, `Dockerfile`, `docker-compose.yml`, `test_api.py` — unchanged from the prior pass, still verified working