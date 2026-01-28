use axum::{http::StatusCode, Json};
use base64::engine::general_purpose::URL_SAFE;
use base64::Engine;
use regex::Regex;
use std::path::PathBuf;
use tracing::error;

use crate::config::Config;

/// Decode a base64-encoded demo URL
pub fn decode_demo_url(demo_url: &str) -> Result<String, (StatusCode, Json<serde_json::Value>)> {
    let decoded_url_bytes = match URL_SAFE.decode(demo_url) {
        Ok(bytes) => bytes,
        Err(e) => {
            error!("[parse_demo] Failed to decode base64 demo_url: {}", e);
            return Err((
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": format!("Invalid base64 in demo_url: {}", e)})),
            ));
        }
    };
    Ok(String::from_utf8_lossy(&decoded_url_bytes).into_owned())
}

/// Extract filename from URL and build compressed replay path
pub fn setup_compressed_replay_path(
    decoded_url: &str
) -> Result<(PathBuf, PathBuf), (StatusCode, Json<serde_json::Value>)> {
    let re = match Regex::new(r"(\d+_\d+\.dem\.bz2)") {
        Ok(re) => re,
        Err(e) => {
            error!("[parse_demo] Regex error while extracting filename: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": format!("Regex error: {}", e)})),
            ));
        }
    };

    let filename: PathBuf = match re
        .captures(decoded_url)
        .and_then(|cap| cap.get(1))
        .map(|m| PathBuf::from(m.as_str()))
    {
        Some(f) => f,
        None => {
            error!("[parse_demo] Could not extract filename from URL: {}", decoded_url);
            return Err((
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": format!("Could not extract filename from URL: {}", decoded_url)})),
            ));
        }
    };

    let config = Config::from_env();
    let replay_path = config.compressed_replays_dir.join(&filename);

    Ok((filename, replay_path))
}
