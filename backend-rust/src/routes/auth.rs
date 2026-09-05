use axum::{routing::post, Router};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::auth;

pub fn auth_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/register", post(auth::register))
        .route("/login", post(auth::login))
}
