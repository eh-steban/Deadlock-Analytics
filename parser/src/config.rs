use std::env;
use std::path::PathBuf;

/// Application configuration loaded from environment variables
#[derive(Clone, Debug)]
pub struct Config {
    pub replays_dir: PathBuf,
    pub compressed_replays_dir: PathBuf,
    pub port: u16,
}

impl Config {
    /// Load configuration from environment variables
    ///
    /// Panics if required environment variables are not set or invalid
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok(); // Load .env file if it exists

        let replays_dir = env::var("REPLAYS_DIR")
            .expect("REPLAYS_DIR must be set")
            .into();

        let compressed_replays_dir = env::var("COMPRESSED_REPLAYS_DIR")
            .expect("COMPRESSED_REPLAYS_DIR must be set")
            .into();

        let port = env::var("PORT")
            .unwrap_or_else(|_| "9000".to_string())
            .parse()
            .expect("PORT must be a valid u16");

        Self {
            replays_dir,
            compressed_replays_dir,
            port,
        }
    }
}
