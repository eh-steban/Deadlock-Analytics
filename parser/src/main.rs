use axum::{routing::post, Router, Json, http::StatusCode};
use tracing::{info, error};
use tracing_subscriber;
use serde::Deserialize;
use std::{net::SocketAddr, fs::File, io::Write, path::PathBuf};
use regex::Regex;
use base64::engine::general_purpose::URL_SAFE;
use base64::Engine;

#[derive(Deserialize)]
struct ParseRequest {
    demo_url: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/parse", post(parse_demo));

    let addr = SocketAddr::from(([0, 0, 0, 0], 9000));
    info!("listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn parse_demo(Json(payload): Json<ParseRequest>) -> impl axum::response::IntoResponse {
    // Decode the base64-encoded demo_url
    info!("[parse_demo] Decoding base64 demo_url");
    let decoded_url_bytes = match URL_SAFE.decode(&payload.demo_url) {
        Ok(bytes) => bytes,
        Err(e) => {
            error!("[parse_demo] Failed to decode base64 demo_url: {}", e);
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": format!("Invalid base64 in demo_url: {}", e)})),
            );
        }
    };
    let decoded_url = String::from_utf8_lossy(&decoded_url_bytes).into_owned();

    // Extract {match_id}.dem.bz2 from the decoded URL
    info!("[parse_demo] Extracting filename from decoded URL");
    let re = match Regex::new(r"(\d+\.dem\.bz2)") {
        Ok(re) => re,
        Err(e) => {
            error!("[parse_demo] Regex error while extracting filename: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": format!("Regex error: {}", e)})),
            );
        }
    };
    let filename: PathBuf = match re.captures(&decoded_url)
        .and_then(|cap| cap.get(1))
        .map(|m| PathBuf::from(m.as_str()))
    {
        Some(f) => f,
        None => {
            error!("[parse_demo] Could not extract filename from URL: {}", decoded_url);
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": format!("Could not extract filename from URL: {}", decoded_url)})),
            );
        }
    };

    // Build the path in /compressed-replays
    // let replay_path = PathBuf::from("./compressed-replays").join(&filename);
    let replay_path = PathBuf::from("/workspaces/Deadlock-Stats/parser/src/compressed-replays").join(&filename);

    // Download the replay via decoded URL
    info!("[parse_demo] Downloading replay from URL: {}. replay_path: {}", decoded_url, replay_path.display());
    let bytes = match reqwest::get(&decoded_url).await {
        Ok(resp) => match resp.bytes().await {
            Ok(b) => b,
            Err(e) => {
                error!("[parse_demo] Failed to read bytes from response: {}", e);
                return (
                    StatusCode::BAD_GATEWAY,
                    Json(serde_json::json!({"error": format!("Failed to read bytes from response: {}", e)})),
                );
            }
        },
        Err(e) => {
            error!("[parse_demo] Failed to download demo from URL: {}", e);
            return (
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({"error": format!("Failed to download demo: {}", e)})),
            );
        }
    };

    // Write it to file
    info!("[parse_demo] Writing replay to file: {}", replay_path.display());
    if let Err(e) = File::create(&replay_path)
        .and_then(|mut file| file.write_all(&bytes))
    {
        error!("[parse_demo] Failed to write replay to file: {}", e);
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": format!("Failed to write file: {}", e)})),
        );
    }

    // Return status
    info!("[parse_demo] Successfully downloaded and saved replay to {}", replay_path.display());
    (
        StatusCode::OK,
        Json(serde_json::json!({
            "status": "downloaded",
            "saved_to": replay_path.to_string_lossy()
        })),
    )
}
