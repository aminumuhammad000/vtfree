use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::vtstack;

pub fn vtstack_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/virtual-accounts", post(vtstack::get_virtual_accounts).get(vtstack::get_virtual_accounts))
        .route("/virtual-accounts/{account_number}/balance", get(vtstack::get_account_balance))
        .route("/virtual-accounts/{account_number}/transactions", get(vtstack::get_transactions))
}
