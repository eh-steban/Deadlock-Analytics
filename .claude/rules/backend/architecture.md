# Backend Architecture Rules

## DDD Layer Structure

```
backend/
├── app/
│   ├── api/              # HTTP layer (thin routes)
│   ├── application/      # Use cases, orchestration
│   │   ├── mappers/      # ORM → Domain model mapping
│   │   └── use_cases/    # Application use cases
│   ├── domain/           # Pure business logic
│   │   ├── models/       # Entities, value objects
│   │   ├── services/     # Domain services (pure, no I/O)
│   │   └── exceptions.py
│   ├── infra/            # Infrastructure
│   │   ├── db/
│   │   │   ├── models/       # SQLModel table definitions
│   │   │   └── repositories/ # Data access layer
│   │   ├── external/     # External API clients
│   │   └── storage/      # S3 storage (future)
│   └── utils/            # Cross-cutting utilities
```

## Layer Dependency Rules

| Layer | Can Import |
|-------|------------|
| `api/` | `application/`, `domain/models/`, `utils/` |
| `application/use_cases/` | `application/mappers/`, `domain/`, `infra/`, `utils/` |
| `application/mappers/` | `domain/models/`, `infra/db/models/`, `utils/` |
| `domain/models/` | Nothing (pure data structures) |
| `domain/services/` | `domain/models/`, `utils/` |
| `infra/db/models/` | `utils/` only |
| `infra/db/repositories/` | `infra/db/models/`, `utils/` |
| `infra/external/` | `domain/models/`, `utils/` |
| `utils/` | Nothing (pure utilities) |

## File Naming Conventions

| Language | Convention | Example |
|----------|------------|---------|
| Python | snake_case | `transform_match_data.py`, `user_repository.py` |

## Key Patterns

### Domain vs Application Services

- **Domain services** (`domain/services/`): Pure business logic, no I/O, no framework dependencies
- **Application services** (`application/`): Orchestration, use cases, coordinates domain + infra

### Repository Return Types

Repositories return ORM models. Mapping to domain models happens in `application/mappers/`.

```python
# ✅ Repository returns ORM model
# infra/db/repositories/match_repository.py
class MatchRepository:
    def get_by_id(self, match_id: int) -> ParsedMatchModel | None:
        ...

# ✅ Mapper converts ORM → Domain
# application/mappers/match_mapper.py
class MatchMapper:
    def to_domain(self, orm: ParsedMatchModel) -> TransformedMatchData:
        ...

# ✅ Use case orchestrates repo + mapper
# application/use_cases/analyze_match.py
class AnalyzeMatchUseCase:
    def execute(self, match_id: int) -> MatchAnalysis:
        orm_model = self.repo.get_by_id(match_id)
        return self.mapper.to_domain(orm_model)
```

### Service Naming Convention

Domain services are named by their **output** (what they produce), not input:

```python
# ✅ Good - describes output
transform_match_data.py      # Outputs TransformedMatchData
aggregate_player_damage.py   # Outputs aggregated damage stats

# ❌ Bad - describes input
transform_parsed_match.py
```
