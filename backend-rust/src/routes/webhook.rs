use axum::{
    routing::post,
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::webhook;

pub fn webhook_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/vtstack", post(webhook::handle_vtstack_webhook))
        .route("/{app_id}/vtstack", post(webhook::handle_vtstack_webhook))
        .route("/{app_id}", post(webhook::handle_vtstack_webhook))
}
