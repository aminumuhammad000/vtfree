use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::support;

pub fn support_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/", post(support::create_ticket).get(support::get_tickets))
        .route("/{id}", get(support::get_ticket_by_id))
}
