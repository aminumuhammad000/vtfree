use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::wallet;

pub fn wallet_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/", get(wallet::get_wallet))
        .route("/fund", post(wallet::fund_wallet))
        .route("/transactions", get(wallet::get_wallet_transactions))
}
