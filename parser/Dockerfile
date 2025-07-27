FROM rust:latest

WORKDIR /parser

RUN apt-get update && \
    apt-get install -y protobuf-compiler && \
    rm -rf /var/lib/apt/lists/*

RUN adduser -u 5678 --disabled-password --gecos "" lifted && chown -R lifted /parser
USER lifted

COPY . /parser/

RUN rustc --version
RUN protoc --version
