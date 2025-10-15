FROM rust:latest as builder

WORKDIR /parser

RUN apt-get update && \
    apt-get install -y protobuf-compiler && \
    rm -rf /var/lib/apt/lists/*

RUN adduser -u 5678 --disabled-password --gecos "" lifted && chown -R lifted /parser
USER lifted

COPY . /parser/

RUN rustc --version
RUN protoc --version

RUN cargo build --release

CMD ["cargo", "run"]


# build for Production
FROM debian:bookworm-slim as production

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /parser

COPY --from=builder /parser/target/release/parser .
CMD ["./parser"]

RUN mkdir -p /parser/src/compressed-replays
