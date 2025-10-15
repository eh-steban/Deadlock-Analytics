use axum::{
    http::StatusCode,
    routing::get,
    Json, Router,
};
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
}

#[derive(Serialize)]
struct ReadinessResponse {
    status: &'static str,
    ready: bool,
}

/// Liveness probe endpoint
/// Returns 200 OK if the application is running
async fn liveness() -> (StatusCode, Json<HealthResponse>) {
    (
        StatusCode::OK,
        Json(HealthResponse { status: "alive" }),
    )
}

/// Readiness probe endpoint
/// Returns 200 OK if the application is ready to serve traffic
async fn readiness() -> (StatusCode, Json<ReadinessResponse>) {
    // Add your readiness checks here (database connections, external services, etc.)
    let is_ready = check_readiness().await;

    if is_ready {
        (
            StatusCode::OK,
            Json(ReadinessResponse {
                status: "ready",
                ready: true,
            }),
        )
    } else {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ReadinessResponse {
                status: "not ready",
                ready: false,
            }),
        )
    }
}

/// Startup probe endpoint
/// Returns 200 OK if the application has started successfully
async fn startup() -> (StatusCode, Json<HealthResponse>) {
    // Add your startup checks here
    (
        StatusCode::OK,
        Json(HealthResponse { status: "started" }),
    )
}

/// Implement your readiness checks here
async fn check_readiness() -> bool {
    // Example: Check database connection, cache availability, etc.
    // For now, return true
    true
}

pub fn routes() -> Router {
    Router::new()
        .route("/health/live", get(liveness))
        .route("/health/ready", get(readiness))
        .route("/health/startup", get(startup))
}
