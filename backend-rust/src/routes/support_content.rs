use axum::{
    routing::get,
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::support_content;

pub fn support_content_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/content", get(support_content::get_support_content))
        .route("/faqs", get(support_content::get_faqs))
}
