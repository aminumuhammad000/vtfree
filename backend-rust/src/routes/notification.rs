use axum::{
    routing::{get, put, delete},
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::notification;

pub fn notification_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/", get(notification::get_notifications))
        .route("/{id}/read", put(notification::mark_as_read))
        .route("/{id}", delete(notification::delete_notification))
}
