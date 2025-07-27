use axum::{routing::post, Router, Json};
use serde::Deserialize;
use std::net::SocketAddr;

#[derive(Deserialize)]
struct ParseRequest {
    demo_url: String,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/parse", post(parse_demo));

    let addr = SocketAddr::from(([0, 0, 0, 0], 9000));
    println!("listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn parse_demo(Json(payload): Json<ParseRequest>) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok",
        "demo_url": payload.demo_url
    }))
}
