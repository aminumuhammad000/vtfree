use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::utils::ApiResponse;

pub async fn handle_vtstack_webhook(
    app_id: Option<Path<String>>,
    State(_db): State<Arc<DbContext>>,
    Json(payload): Json<serde_json::Value>,
) -> Response {
    let app_id_str = app_id.map(|Path(id)| id);
    tracing::info!("Received VTStack webhook for app: {:?}, payload: {:?}", app_id_str, payload);
    ApiResponse::success((), "Webhook processed", StatusCode::OK)
}
