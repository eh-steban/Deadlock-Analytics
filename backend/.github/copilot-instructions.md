# applyTo: /backend
---
applyTo: "**/*.py"
---

# 🐍 Python (FastAPI) Project Coding Standards

## 🧱 Architecture & Structure

This project follows **Domain-Driven Design (DDD)** principles:

- `domain/` — Pure domain models and rules (no frameworks)
- `services/` — Application use cases, orchestrating domain logic
- `infra/` — External systems (Steam, DB, file I/O)
- `repo/` — Data access interfaces and implementations
- `api/` — FastAPI routes
- `dependencies.py` — Dependency injection bindings
- `config.py` — App settings (e.g. environment, secrets)
- `main.py` — App instantiation and router registration

---

## 🗂 Folder Responsibilities

### `/domain/{context}/`
- Contains only business logic
- Define `BaseModel` classes here (e.g., `User`, `Match`)
- Validate inputs, enforce invariants, encapsulate rules

### `/services/{context}/`
- Contains use case logic (e.g. login via Steam, link user)
- Orchestrates domain models and external systems

### `/infra/{context}/`
- Interfaces with external APIs (Steam, DB drivers, file systems)
- Wraps `httpx`, `sqlalchemy`, or other libraries

### `/repo/{context}/`
- Contains abstractions for database or data layer
- May define and implement interfaces like `UserRepository`

### `/api/{context}/`
- Defines FastAPI routes and request/response models
- Minimal logic — delegate to services
- Use `APIRouter`, handle exceptions, return responses

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
- Use positive language in code where possible (e.g., `is_active` instead of `is_not_inactive`)

## 🔁 Reusability & Dependencies

- Place shared helpers/utilities in `utils/` module
- Inject dependencies using FastAPI’s `Depends` mechanism
- Keep `DeadlockApiClient`, JWT helpers, etc. testable and stateless

## 🐳 Docker & Env

- Assume code runs in Docker
- Use `.env` file + `pydantic.BaseSettings` to load runtime config
- Fail fast if critical env vars (like `API_KEY`) are missing
