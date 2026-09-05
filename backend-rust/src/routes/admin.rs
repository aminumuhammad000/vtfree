use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::admin;

pub fn admin_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/login", post(admin::admin_login))
        .route("/dashboard", get(admin::get_dashboard_stats))
        .route("/profile", get(admin::get_admin_profile))
}
