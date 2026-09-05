use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
};
use futures::TryStreamExt;
use mongodb::bson::{doc, oid::ObjectId};
use std::sync::Arc;
use crate::db::DbContext;
use crate::models::Promotion;
use crate::utils::ApiResponse;
use crate::middleware::auth::AuthUser;

pub async fn get_active_promotions(
    _auth: AuthUser,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<Promotion>("promotions");
    
    let filter = doc! {
        "status": "active",
        "end_date": { "$gt": mongodb::bson::DateTime::now() }
    };

    let mut cursor = match collection.find(filter).await {
        Ok(c) => c,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    let mut promotions = Vec::new();
    while let Ok(Some(p)) = cursor.try_next().await {
        promotions.push(p);
    }

    ApiResponse::success(promotions, "Promotions retrieved successfully", StatusCode::OK)
}

pub async fn get_promotion_by_id(
    _auth: AuthUser,
    Path(id): Path<String>,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<Promotion>("promotions");
    let promo_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return ApiResponse::error("Invalid promotion ID", StatusCode::BAD_REQUEST),
    };

    match collection.find_one(doc! { "_id": promo_id }).await {
        Ok(Some(p)) => ApiResponse::success(p, "Promotion retrieved successfully", StatusCode::OK),
        _ => ApiResponse::error("Promotion not found", StatusCode::NOT_FOUND),
    }
}
