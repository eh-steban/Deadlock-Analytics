use axum::{routing::post, Router, Json, http::StatusCode};
use bzip2::read::BzDecoder;
use tracing::{info, error};
use tracing_subscriber;
use serde::Deserialize;
use std::{net::SocketAddr, fs::File, io::Write, path::PathBuf, path::Path};
use regex::Regex;
use base64::engine::general_purpose::URL_SAFE;
use base64::Engine;

mod replay_parser;

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
    info!("[parse_demo] Received request to parse demo with URL: {}", payload.demo_url);
    let decoded_url = match decode_demo_url(&payload.demo_url) {
        Ok(url) => url,
        Err(e) => return e,
    };

    let (filename, replay_path) = match setup_compressed_replay_path(&decoded_url) {
        Ok((filename, replay_path)) => (filename, replay_path),
        Err(e) => return e,
    };

    if let Err(e) = download_compressed_replay_file(&decoded_url, &replay_path).await {
        return e;
    }

    let decompressed_path = match decompress_replay_file(&replay_path, &filename) {
        Ok(path) => path,
        Err(e) => return e,
    };

    let result = replay_parser::parse_replay(decompressed_path.to_str().unwrap());
    match result {
        Ok(json) => {
            info!("[parse_demo] Replay parsed successfully.");
            (StatusCode::OK, Json(json))
        },
        Err(e) => {
            error!("[parse_demo] replay_parser::parse_replay failed: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
                "error": format!("Failed to parse replay: {}", e)
            })))
        }
    }
}

fn decode_demo_url(demo_url: &str) -> Result<String, (StatusCode, Json<serde_json::Value>)> {
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

fn setup_compressed_replay_path(decoded_url: &str) -> Result<(PathBuf, PathBuf), (StatusCode, Json<serde_json::Value>)> {
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
    let filename: PathBuf = match re.captures(decoded_url)
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
    let replay_path = PathBuf::from("/parser/src/compressed-replays").join(&filename);
    Ok((filename, replay_path))
}

// Download the replay file from the given URL and write it to replay_path
async fn download_compressed_replay_file(
    decoded_url: &str,
    replay_path: &PathBuf,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    if Path::new(replay_path).exists() {
        info!("[parse_demo] Replay file already exists at {}. Skipping download.", replay_path.display());
        return Ok(());
    }
    info!("[parse_demo] Downloading replay from URL: {} to the replay path: {}", decoded_url, replay_path.display());
    let bytes = match reqwest::get(decoded_url).await {
        Ok(resp) => match resp.bytes().await {
            Ok(b) => b,
            Err(e) => {
                error!("[parse_demo] Failed to read bytes from response: {}", e);
                return Err((
                    StatusCode::BAD_GATEWAY,
                    Json(serde_json::json!({"error": format!("Failed to read bytes from response: {}", e)})),
                ));
            }
        },
        Err(e) => {
            error!("[parse_demo] Failed to download demo from URL: {}", e);
            return Err((
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({"error": format!("Failed to download demo: {}", e)})),
            ));
        }
    };
    if let Err(e) = File::create(replay_path)
        .and_then(|mut file| file.write_all(&bytes))
    {
        error!("[parse_demo] Failed to write replay to file: {}", e);
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": format!("Failed to write file: {}", e)})),
        ));
    }
    Ok(())
}

fn decompress_replay_file(
    replay_path: &PathBuf,
    filename: &PathBuf,
) -> Result<PathBuf, (StatusCode, Json<serde_json::Value>)> {
    let decompressed_filename = filename.file_stem().unwrap_or_else(|| filename.as_os_str());
    let decompressed_path = PathBuf::from("/parser/src/replays").join(decompressed_filename);

    if Path::new(&decompressed_path).exists() {
        info!("[parse_demo] Decompressed replay file already exists at {}. Skipping decompression.", decompressed_path.display());
        return Ok(decompressed_path);
    }
    info!("[parse_demo] Decompressing replay to {}", decompressed_path.display());

    let compressed_file = match File::open(replay_path) {
        Ok(f) => f,
        Err(e) => {
            error!("[parse_demo] Failed to open compressed file: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": format!("Failed to open compressed file: {}", e)})),
            ));
        }
    };
    let mut decoder = BzDecoder::new(compressed_file);
    let mut decompressed_file = match File::create(decompressed_path.clone()) {
        Ok(f) => f,
        Err(e) => {
            error!("[parse_demo] Failed to create decompressed file: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": format!("Failed to create decompressed file: {}", e)})),
            ));
        }
    };
    if let Err(e) = std::io::copy(&mut decoder, &mut decompressed_file) {
        error!("[parse_demo] Failed to decompress file: {}", e);
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": format!("Failed to decompress file: {}", e)})),
        ));
    }
    Ok(decompressed_path)
}