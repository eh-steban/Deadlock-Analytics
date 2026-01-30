FROM rust:latest

WORKDIR /parser

RUN apt-get update && \
    apt-get install -y protobuf-compiler && \
    rm -rf /var/lib/apt/lists/*

RUN adduser -u 5678 --disabled-password --gecos "" lifted && chown -R lifted /parser
RUN cargo install cargo-watch
RUN mkdir -p /parser/src/compressed-replays
RUN mkdir -p /parser/src/replays

COPY . /parser/

RUN rustc --version
RUN protoc --version

CMD ["cargo", "watch", "-i", "src/compressed-replays/", "-i", "src/replays/", "-x", "run"]
