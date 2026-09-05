use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
};
use mongodb::bson::doc;
use std::sync::Arc;
use crate::db::DbContext;
use crate::utils::ApiResponse;
use crate::middleware::auth::AuthUser;

pub async fn get_support_content(
    _auth: AuthUser,
    State(_db): State<Arc<DbContext>>,
) -> Response {
    let content = vec![
        doc! { "topic": "General", "content": "Welcome to support" }
    ];
    ApiResponse::success(content, "Support content retrieved", StatusCode::OK)
}

pub async fn get_faqs(
    _auth: AuthUser,
    State(_db): State<Arc<DbContext>>,
) -> Response {
    let faqs = vec![
        doc! { "question": "How to fund wallet?", "answer": "Use the funding menu" }
    ];
    ApiResponse::success(faqs, "FAQs retrieved", StatusCode::OK)
}
