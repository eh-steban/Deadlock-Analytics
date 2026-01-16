# Deadlock Stats - Architecture

## Overview

Deadlock Stats is a monorepo containing three microservices that work together to parse, transform, and display match analytics for the game Deadlock.

The project follows **Domain-Driven Design (DDD)** principles with clear bounded contexts and layered architecture.

---

## Project Structure

```
Deadlock-Stats/
├── backend/                # Python/FastAPI microservice
├── frontend/               # React/TypeScript microservice
├── parser/                 # Rust/Axum microservice
├── docker-compose.yaml     # Local development orchestration
└── k8s/                    # Kubernetes manifests (shared)
    ├── backend/
    ├── frontend/
    ├── parser/
    └── shared/             # Ingress, secrets, configmaps
```

---

## Microservices

### Backend (Python/FastAPI)

The API layer that orchestrates data flow between the parser, external APIs, and storage.

```
backend/
├── app/
│   ├── api/                          # HTTP Layer (thin routes)
│   │   ├── match.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── account.py
│   │   ├── replay.py
│   │   └── session.py
│   │
│   ├── application/                  # Use Cases / Orchestration
│   │   ├── analyze_match.py          # AnalyzeMatchUseCase
│   │   └── ...
│   │
│   ├── domain/                       # Business Logic (pure, no framework deps)
│   │   ├── models/                   # Entities & Value Objects
│   │   │   ├── match_analysis.py
│   │   │   ├── player.py
│   │   │   ├── boss.py
│   │   │   ├── steam_account.py
│   │   │   └── deadlock_api.py
│   │   ├── services/                 # Domain Services (named by output)
│   │   │   ├── transform_match_data.py
│   │   │   └── ...
│   │   └── exceptions.py
│   │
│   ├── infra/                        # Infrastructure Layer
│   │   ├── db/
│   │   │   ├── models/               # SQLModel table definitions
│   │   │   │   ├── user.py
│   │   │   │   └── parsed_match.py
│   │   │   ├── repositories/         # Data access layer
│   │   │   │   ├── user_repository.py
│   │   │   │   └── match_repository.py
│   │   │   ├── session.py
│   │   │   └── migrations/
│   │   ├── external/                 # External API clients
│   │   │   └── deadlock_api_client.py
│   │   └── storage/                  # FUTURE: S3/Parquet storage
│   │       └── ...
│   │
│   ├── utils/                        # Cross-cutting utilities
│   │   ├── datetime_utils.py
│   │   ├── http_cache.py
│   │   ├── logger.py
│   │   └── steam_id_utils.py
│   │
│   ├── config.py
│   └── main.py
│
├── tests/                            # Mirrors app/ structure
│   ├── api/
│   ├── application/
│   ├── domain/
│   │   ├── models/
│   │   └── services/
│   ├── infra/
│   │   └── db/
│   │       └── repositories/
│   └── conftest.py
│
├── Dockerfile
├── pyproject.toml
└── requirements.txt
```

#### Backend Layer Dependency Rules

```
┌─────────────────────────────────────────────────────────────┐
│                         api/                                │
│                          ↓                                  │
│                     application/                            │
│                    ↓           ↓                            │
│              domain/          infra/                        │
│            ↓        ↓            ↓                          │
│        models/   services/    (db/, external/, storage/)    │
│                                                             │
│                       utils/ ← (available to all)           │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Can Import |
|-------|------------|
| `api/` | `application/`, `domain/models/`, `utils/` |
| `application/` | `domain/`, `infra/`, `utils/` |
| `domain/models/` | Nothing (pure data structures) |
| `domain/services/` | `domain/models/`, `utils/` |
| `infra/db/models/` | `utils/` only |
| `infra/db/repositories/` | `domain/models/`, `infra/db/models/`, `utils/` |
| `infra/external/` | `domain/models/`, `utils/` |
| `utils/` | Nothing (pure utilities) |

---

### Frontend (React/TypeScript)

The web application for viewing match analytics.

```
frontend/
├── src/
│   ├── api/                          # API Clients
│   │   └── matchAnalysis.ts
│   │
│   ├── domain/                       # Domain Models (mirrors backend)
│   │   ├── matchAnalysis.ts
│   │   ├── player.ts
│   │   ├── boss.ts
│   │   ├── timeline.ts
│   │   └── ...
│   │
│   ├── services/                     # Business Logic
│   │   ├── damage/
│   │   │   ├── index.ts
│   │   │   ├── aggregation.ts
│   │   │   └── helpers.ts
│   │   └── timeline/
│   │       └── index.ts
│   │
│   ├── hooks/                        # React Hooks
│   │   └── useMatchAnalysis.ts
│   │
│   ├── components/                   # Feature-grouped Components
│   │   ├── matchAnalysis/
│   │   │   ├── MatchTimeViewer.tsx
│   │   │   ├── Minimap.tsx
│   │   │   ├── PlayerCards.tsx
│   │   │   └── ...
│   │   ├── damageAnalysis/
│   │   │   ├── PlayerDamageDistribution.tsx
│   │   │   └── ...
│   │   ├── profile/
│   │   └── login/
│   │
│   ├── pages/                        # Route-level Components
│   │   ├── MatchAnalysis.tsx
│   │   └── ...
│   │
│   ├── data/                         # Static Data
│   │   ├── combatTypes.ts
│   │   ├── regions.ts
│   │   └── ...
│   │
│   ├── utils/                        # Utilities
│   │   └── time.ts
│   │
│   ├── App.tsx
│   └── index.tsx
│
├── tests/                            # Mirrors src/ structure
│   ├── api/
│   ├── domain/
│   ├── services/
│   ├── hooks/
│   ├── components/
│   └── pages/
│
├── Dockerfile
├── package.json
└── vite.config.ts
```

#### Frontend Layer Dependency Rules

```
┌─────────────────────────────────────────────────────────────┐
│                        pages/                               │
│                          ↓                                  │
│                     components/                             │
│                    ↓     ↓    ↓                             │
│               hooks/   api/  services/                      │
│                    ↓     ↓    ↓                             │
│                       domain/                               │
│                                                             │
│              utils/ ← (available to all)                    │
│              data/  ← (available to all)                    │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Can Import |
|-------|------------|
| `pages/` | `components/`, `hooks/`, `api/`, `domain/`, `services/`, `utils/`, `data/` |
| `components/` | `hooks/`, `domain/`, `utils/`, `data/`, other `components/` |
| `hooks/` | `api/`, `domain/`, `services/`, `utils/` |
| `api/` | `domain/`, `utils/` |
| `services/` | `domain/`, `utils/`, `data/` |
| `domain/` | Nothing (pure type definitions) |
| `utils/` | Nothing (pure utilities) |
| `data/` | `domain/` only (for typing static data) |

---

### Parser (Rust/Axum)

The replay file parser that extracts match data from demo files.

```
parser/
├── src/
│   ├── main.rs                       # Axum server setup
│   ├── replay_parser.rs              # Core parsing logic
│   ├── handlers/                     # HTTP route handlers
│   │   └── parse.rs
│   └── models/                       # Rust structs for data shapes
│       └── ...
│
├── tests/
│   └── ...
│
├── Cargo.toml
└── Dockerfile
```

---

## File Naming Conventions

| Language | Convention | Example |
|----------|------------|---------|
| Python | snake_case | `transform_match_data.py`, `user_repository.py` |
| Rust | snake_case | `replay_parser.rs`, `match_data.rs` |
| TypeScript (files) | camelCase | `matchAnalysis.ts`, `useMatchAnalysis.ts` |
| React Components | TitleCase | `PlayerCards.tsx`, `MatchTimeViewer.tsx` |

### Service Naming Convention

Domain services are named by their **output** (what they produce), not their input:

```
✓ transform_match_data.py     # Outputs TransformedMatchData
✓ aggregate_player_damage.py  # Outputs aggregated damage stats
✗ transform_parsed_match.py   # Describes input, not output
```

---

## Data Flow

### Current Architecture

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌────────────┐
│ Replay  │───▶│ Parser  │───▶│ Backend │───▶│ PostgreSQL │
│ File    │    │ (Rust)  │    │ (Python)│    │ (JSONB)    │
└─────────┘    └─────────┘    └─────────┘    └────────────┘
                                   │
                                   ▼
                             ┌──────────┐
                             │ Frontend │
                             │ (React)  │
                             └──────────┘
```

1. User requests match analysis
2. Backend checks PostgreSQL cache
3. If not cached: fetch demo URL → call Parser → transform → store
4. Return transformed data with ETag caching

### Future Architecture (S3/Parquet)

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Replay  │───▶│ Parser  │───▶│ Backend │
│ File    │    │ (Rust)  │    │ (Python)│
└─────────┘    └─────────┘    └─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌──────────┐  ┌───────────┐  ┌───────────┐
              │PostgreSQL│  │    S3     │  │  Parquet  │
              │(metadata)│  │(raw data) │  │(analytics)│
              └──────────┘  └───────────┘  └───────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   ▼
                             ┌──────────┐
                             │ Backend  │
                             │ (proxy)  │
                             └──────────┘
                                   │
                                   ▼
                             ┌──────────┐
                             │ Frontend │
                             └──────────┘
```

- PostgreSQL: Metadata and relationships only
- S3: Raw compressed parser output, transformed per-player JSON
- Parquet: Columnar format for analytical queries
- Backend: Acts as proxy with ETag caching

### Future Architecture (Event-Driven)

After S3/Parquet work, a messaging queue will be introduced for replay processing:

```
┌─────────────┐    ┌───────────────┐    ┌─────────┐
│ Replay      │───▶│ Message Queue │───▶│ Parser  │
│ Upload/URL  │    │ (events)      │    │ Workers │
└─────────────┘    └───────────────┘    └─────────┘
                          │                   │
                          ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ Backend     │    │ S3/Parquet  │
                   │ (listeners) │    │ Storage     │
                   └─────────────┘    └─────────────┘
```

Event-driven architecture (EDA) will handle:
- Replay download events
- Replay upload events
- Parse completion events
- Transform completion events

---

## Infrastructure

### Local Development

```yaml
# docker-compose.yaml (root level)
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [db, parser]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]

  parser:
    build: ./parser
    ports: ["8080:8080"]

  db:
    image: postgres:16
    volumes: [postgres_data:/var/lib/postgresql/data]
```

### Kubernetes (Production)

```
k8s/
├── backend/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml                # Horizontal Pod Autoscaler
├── frontend/
│   ├── deployment.yaml
│   └── service.yaml
├── parser/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
└── shared/
    ├── ingress.yaml            # Route external traffic
    ├── configmap.yaml          # Shared configuration
    └── secrets.yaml            # Sensitive data (encrypted)
```

---

## API Alignment Principle

External APIs (like Deadlock's official API) are the source of truth for naming conventions:

- Avoid translation layers between internal/external schemas
- Use the same field names as external APIs where possible
- Reduces cognitive overhead and potential bugs

Example: If Deadlock API returns `match_id`, use `match_id` internally, not `matchId` or `game_id`.

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| DDD with layered architecture | Clear separation of concerns, testable business logic |
| Monorepo with microservices | Shared tooling, atomic commits, independent deployments |
| PostgreSQL + future S3/Parquet | Relational for metadata, object storage for large blobs, columnar for analytics |
| ETag caching | Reduce bandwidth, enable 304 responses |
| Output-named services | Clarity on what each service produces |
| Feature-grouped components | Colocation of related UI code |

---

## Roadmap

Planned architectural evolution in order:

1. **Current** - PostgreSQL with JSONB storage, synchronous parsing
2. **S3/Parquet Migration** - Move match data to object storage, PostgreSQL for metadata only
3. **Messaging Queue / EDA** - Async replay processing via message queue and event-driven architecture
