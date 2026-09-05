use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::transaction;

pub fn transaction_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/", post(transaction::create_transaction).get(transaction::get_transactions))
        .route("/{id}", get(transaction::get_transaction_by_id))
}
