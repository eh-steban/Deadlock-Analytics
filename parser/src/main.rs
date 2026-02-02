use axum::{routing::{get, post}, Router};
use tracing_subscriber;
use std::net::SocketAddr;
use once_cell::sync::Lazy;
use tower_http::compression::CompressionLayer;
use tracing::info;

mod config;
mod demo;
mod domain;
mod entities;
mod handlers;
mod replay_parser;
mod tracking;
mod utils;

use config::Config;
use handlers::{check_demo, parse_demo};

static CONFIG: Lazy<Config> = Lazy::new(Config::from_env);

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/parse", post(parse_demo))
        .route("/check-demo/{match_id}", get(check_demo))
        .layer(CompressionLayer::new());

    let addr = SocketAddr::from(([0, 0, 0, 0], CONFIG.port));
    info!("listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
