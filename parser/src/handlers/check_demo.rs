use axum::{Json, extract::Path as AxumPath};
use serde::Serialize;
use std::path::PathBuf;
use tracing::{info, error};

use crate::config::Config;

#[derive(Serialize)]
pub struct CheckDemoResponse {
    pub available: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filename: Option<String>,
}

/// Check if a demo file exists locally for the given match ID
///
/// Searches the replays directory for files matching: {match_id}_*.dem OR {match_id}.dem
/// Returns gracefully with `available: false` on errors to allow backend fallback
pub async fn check_demo(AxumPath(match_id): AxumPath<u64>) -> Json<CheckDemoResponse> {
    info!("[check_demo] Checking for local demo file for match_id: {}", match_id);

    let config = Config::from_env();
    let replays_dir = &config.replays_dir;

    match std::fs::read_dir(replays_dir) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let file_name = entry.file_name();
                let file_name_str = file_name.to_string_lossy();

                // Match: {match_id}_*.dem OR {match_id}.dem
                if file_name_str.starts_with(&match_id.to_string())
                    && file_name_str.ends_with(".dem") {
                    info!("[check_demo] Found local demo: {}", file_name_str);
                    return Json(CheckDemoResponse {
                        available: true,
                        filename: Some(file_name_str.to_string()),
                    });
                }
            }
            info!("[check_demo] Parser does not have local demo for match_id: {}", match_id);
            Json(CheckDemoResponse {
                available: false,
                filename: None,
            })
        }
        Err(e) => {
            error!("[check_demo] Failed to read replays directory: {}", e);
            // Graceful degradation: return unavailable instead of error
            Json(CheckDemoResponse {
                available: false,
                filename: None,
            })
        }
    }
}
