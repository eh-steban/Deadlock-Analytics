use axum::{routing::post, Router, Json, http::StatusCode};
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
    let app = Router::new()
        .route("/parse", post(parse_demo));

    let addr = SocketAddr::from(([0, 0, 0, 0], 9000));
    println!("listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn parse_demo(Json(payload): Json<ParseRequest>) -> Result<Json<serde_json::Value>, StatusCode> {
    // 1. Decode the base64-encoded demo_url
    let decoded_url_bytes = match URL_SAFE.decode(&payload.demo_url) {
        Ok(bytes) => bytes,
        Err(_) => {
            return Err(StatusCode::BAD_REQUEST);
        }
    };
    let decoded_url = String::from_utf8_lossy(&decoded_url_bytes).into_owned();

    // 2. Extract match_id.dem.bz2 from the decoded URL
    let re = Regex::new(r"(\\d+\\.dem\\.bz2)").unwrap();
    let filename: PathBuf = re.captures(&decoded_url)
        .and_then(|cap| cap.get(1))
        .map(|m| PathBuf::from(m.as_str()))
        .ok_or_else(|| serde_json::json!({"error": "Could not extract filename from URL"}))?;

    // 3. Build the path in /compressed-replays
    let replay_path = PathBuf::from("compressed-replays").join(&filename);

    // 4. Download the replay via decoded URL
    let bytes = reqwest::get(&decoded_url)
        .await
        .expect("failed to download demo")
        .bytes()
        .await
        .expect("failed to read bytes");

    // 5. Write it to file
    let mut file = File::create(&replay_path).expect("failed to create file");
    file.write_all(&bytes).expect("failed to write file");

    // 6. Return status
    Ok(Json(serde_json::json!({
        "status": "downloaded",
        "saved_to": replay_path.to_string_lossy()
    })))
}
