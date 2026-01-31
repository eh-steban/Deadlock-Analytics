# Infrastructure Overview

dashjump.gg infrastructure documentation and containerization strategy.

## Infrastructure Philosophy

- **Local-first development:** Docker Compose for easy local setup
- **Production parity:** Containers match production deployment
- **Developer experience:** Unified devcontainer for all three languages
- **Separation of concerns:** Development and production containers are separate

## Current State

### Environments

| Environment | Status | Description |
|-------------|--------|-------------|
| Local Development | ✅ Active | Docker Compose + devcontainer |
| CI | ✅ Active | GitHub Actions for PRs |
| CD | 🚧 In Progress | Deployment automation (separate branch) |
| Production | ⏳ Planned | Kubernetes deployment |

### Technology Stack

- **Containerization:** Docker, Docker Compose
- **CI/CD:** GitHub Actions
- **Database:** PostgreSQL 16
- **Future:** Kubernetes, Terraform, S3/Parquet storage

## Directory Structure

```
dashjump-gg/
├── .devcontainer/           # Unified development environment
│   ├── Dockerfile           # Node.js 24 + Python 3.13 + Rust
│   ├── docker-compose.yml   # Devcontainer service definition
│   └── devcontainer.json    # VSCode configuration
│
├── backend/
│   └── Dockerfile           # Production backend image (Python 3.13)
│
├── frontend/
│   └── Dockerfile           # Production frontend image (Node 24)
│
├── parser/
│   └── Dockerfile           # Production parser image (Rust)
│
├── docker-compose.yaml      # Local services orchestration
├── .github/workflows/       # CI/CD workflows
└── k8s/                     # Kubernetes manifests (future)
```

## Container Strategy

### Development vs Production

We maintain **two separate containerization strategies**:

1. **Development** (`.devcontainer/`): Unified container with all three language stacks
2. **Production** (`*/Dockerfile`): Service-specific optimized containers

This separation allows:
- Fast, unified development experience (one container, all services)
- Optimized, minimal production images (one language per container)
- Clear separation between dev tooling and production requirements

## Service Details

See detailed documentation:
- [containers.md](containers.md) — Dockerfile structure, multi-stage builds, optimization
- [docker-compose.md](docker-compose.md) — Local orchestration, networking, volumes
- [devcontainer.md](devcontainer.md) — Development environment setup
- [ci-cd.md](ci-cd.md) — CI/CD pipelines, GitHub Actions workflows
- [deployment.md](deployment.md) — Production deployment strategy (future)

## Quick Start

### Local Development

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up backend

# Rebuild after dependency changes
docker-compose up --build backend
```

### Devcontainer

```bash
# Open in VSCode
# Command Palette > "Dev Containers: Reopen in Container"

# Services run via devcontainer
cd backend && uvicorn app.main:app --reload
cd frontend && npm run dev
cd parser && cargo watch -x run
```

### CI

```bash
# CI runs automatically on PRs
# Test locally before pushing:
cd frontend && npm run build
cd backend && ruff check app/ && pytest
cd parser && cargo clippy && cargo test
```

## Related Documentation

- Root [.claude/CLAUDE.md](../.claude/CLAUDE.md) — Project overview
- [observability.md](../observability.md) — Logging standards
- [error-handling.md](../error-handling.md) — Error handling across services
