# Parser Service

Rust/Axum microservice that extracts match data from Deadlock replay (demo) files.

## Current Structure

```
parser/
├── src/
│   ├── main.rs               # Axum server setup
│   ├── replay_parser.rs      # Core parsing logic
│   ├── handlers/             # HTTP route handlers
│   │   └── parse.rs
│   └── models/               # Rust structs for data shapes
│       └── ...
│
├── tests/
│   └── ...
│
├── Cargo.toml
├── Dockerfile
└── docker-compose.yaml
```

## Commands

```bash
# Run server w/ hot reload
cd parser
cargo watch -i src/compressed-replays/ -i src/replays/ -x run

# # Run tests
# cargo test

# # Linting
# cargo clippy

# # Format
# cargo fmt

# Build release
cargo build --release
```

## Data Flow

1. Backend sends replay file URL or data to parser
2. Parser extracts match data from demo file
3. Parser compresses and returns positional and damage data
4. Backend receives and transforms for storage

## Output Data

The parser produces:
- Per-second positional data
- Damage events
- Objective events
- Player metadata

Data is compressed before sending to backend.

## Port

Runs on port `9000` by default.
