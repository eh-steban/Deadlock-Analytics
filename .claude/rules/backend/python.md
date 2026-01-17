# Python Coding Standards

## General

- Python 3.11+
- Use type hints everywhere
- Prefer `dataclass(frozen=True)` for immutable domain models
- Use Pydantic models for API validation and DTOs

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | snake_case | `transform_match_data.py` |
| Classes | PascalCase | `MatchRepository`, `DamageCalculator` |
| Functions | snake_case | `calculate_damage_per_second` |
| Constants | UPPER_SNAKE_CASE | `MAX_MATCH_DURATION` |

## Domain Models

```python
from dataclasses import dataclass

# Immutable where possible
@dataclass(frozen=True)
class MatchEvent:
    timestamp: float
    event_type: str
    player_id: int
    data: dict
```

## Dependency Injection

Use constructor injection for infrastructure concerns:

```python
class MatchRepository:
    def __init__(self, db: Database, s3_client: S3Client):
        self.db = db
        self.s3_client = s3_client
```

## API Design

- Follow REST conventions
- Use Pydantic models for request/response validation
- Return proper HTTP status codes
- Include pagination for list endpoints
