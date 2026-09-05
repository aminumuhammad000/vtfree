use axum::{
    routing::{get, post, patch},
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::super_admin;

pub fn super_admin_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/login", post(super_admin::login))
        .route("/dashboard", get(super_admin::get_dashboard_stats))
        .route("/users", get(super_admin::get_all_users))
        .route("/transactions", get(super_admin::get_all_transactions))
        .route("/settings", get(super_admin::get_system_settings))
        .route("/logs", get(super_admin::get_logs))
}
