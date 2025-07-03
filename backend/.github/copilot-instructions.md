# applyTo: /backend
---
applyTo: "**/*.py"
---

# 🐍 Python (FastAPI) Project Coding Standards

## 🧱 Architecture & Structure

- Follow **Domain-Driven Design (DDD)** principles:
  - Use `/domain` for core business models, value objects, and interfaces
  - Use `/services` for business logic and use cases
  - Use `/infra` for external dependencies like HTTP clients or databases
  - Use `/api` for FastAPI route handlers and request/response models
- Avoid tight coupling between layers — rely on clear interfaces or adapters
- Use async/await for all I/O (HTTP, file, DB)

## 🐍 Naming Conventions

- Use **PascalCase** for classes and Pydantic models (e.g. `MatchHistory`, `DeadlockApiClient`)
- Use **snake_case** for functions, variables, and filenames (e.g. `fetch_match_history`)
- Prefix private variables with a single underscore (`_`)
- Use ALL_CAPS for constants (e.g. `DEFAULT_TIMEOUT`)
- Match filenames to the class or primary export they contain (`match_service.py`, `auth_routes.py`)

## 📦 Imports & Modules

- Group imports: stdlib, 3rd-party, internal
- Use absolute imports (`from app.services.match import MatchService`) instead of relative ones
- Keep `__init__.py` files in all module directories to support clean imports

## 🔐 Configuration

- Load all secrets and config values from a shared `config.py` using `pydantic.BaseSettings`
- Never hardcode API keys, paths, or credentials

## 🛡️ Error Handling

- Always catch and handle HTTP/network exceptions in external API clients
- Raise `HTTPException` in FastAPI routes for client-facing errors
- Include contextual information in log messages
- Use custom exception classes for domain-level errors where appropriate

## 🧪 Testing

- Name test files as `test_*.py`
- Use `pytest`, `pytest-asyncio`, and `pytest-httpx` for testing async code and HTTP requests
- Use `tempfile`, `monkeypatch`, and `aiofiles` for safe file-based tests
- Place tests in `/tests/` directory and mirror app structure when possible

## 🧾 Style & Formatting

- Follow **PEP 8** and **Black** formatting
- Use **type annotations** wherever possible, especially in public methods
- Prefer list/dict comprehensions over manual loops for readability
- Use `typing.Annotated` or `Annotated[...]` with `Depends(...)` for route params when needed

## 🔁 Reusability & Dependencies

- Place shared helpers/utilities in `utils/` module
- Inject dependencies using FastAPI’s `Depends` mechanism
- Keep `DeadlockApiClient`, JWT helpers, etc. testable and stateless

## 🐳 Docker & Env

- Assume code runs in Docker
- Use `.env` file + `pydantic.BaseSettings` to load runtime config
- Fail fast if critical env vars (like `API_KEY`) are missing
