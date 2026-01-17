# Rust Coding Standards

## General

- Follow standard Rust conventions (rustfmt, clippy)
- Use `snake_case` for files, functions, variables
- Use `PascalCase` for types and structs

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Files | snake_case | `replay_parser.rs`, `match_data.rs` |
| Modules | snake_case | `handlers`, `models` |

## Project Structure

```
parser/
├── src/
│   ├── main.rs               # Axum server setup
│   ├── replay_parser.rs      # Core parsing logic
│   ├── handlers/             # HTTP route handlers
│   │   └── parse.rs
│   └── models/               # Rust structs for data shapes
│       └── ...
├── tests/
├── Cargo.toml
├── Dockerfile
└── docker-compose.yaml
```

## Error Handling

- Use `Result<T, E>` for fallible operations
- Define custom error types for domain errors
- Use `thiserror` or `anyhow` as appropriate

## API Design

- Use Axum extractors for request parsing
- Return proper HTTP status codes
- Serialize responses with serde
