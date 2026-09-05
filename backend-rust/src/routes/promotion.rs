use axum::{
    routing::get,
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::promotion;

pub fn promotion_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/", get(promotion::get_active_promotions))
        .route("/{id}", get(promotion::get_promotion_by_id))
}
