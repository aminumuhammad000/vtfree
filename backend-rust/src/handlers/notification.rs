use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
};
use futures::TryStreamExt;
use mongodb::bson::{doc, oid::ObjectId};
use serde::Deserialize;
use std::sync::Arc;
use crate::db::DbContext;
use crate::models::Notification;
use crate::utils::{ApiResponse, PaginationMetadata};
use crate::middleware::auth::AuthUser;

#[derive(Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

pub async fn get_notifications(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Query(q): Query<PaginationQuery>,
) -> Response {
    let collection = db.db.collection::<Notification>("notifications");
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let page = q.page.unwrap_or(1);
    let limit = q.limit.unwrap_or(10);
    let skip = (page - 1) * limit;

    let filter = doc! { "user_id": user_id };
    let total = collection.count_documents(filter.clone()).await.unwrap_or(0);

    let find_options = mongodb::options::FindOptions::builder()
        .skip(Some(skip as u64))
        .limit(Some(limit as i64))
        .sort(doc! { "created_at": -1 })
        .build();

    let mut cursor = match collection.find(filter).with_options(Some(find_options)).await {
        Ok(c) => c,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    let mut notifications = Vec::new();
    while let Ok(Some(n)) = cursor.try_next().await {
        notifications.push(n);
    }

    ApiResponse::paginated(
        notifications,
        PaginationMetadata {
            page,
            limit,
            total,
            pages: ((total as f64) / (limit as f64)).ceil() as u32,
        },
        "Notifications retrieved successfully",
        StatusCode::OK,
    )
}

pub async fn mark_as_read(
    auth: AuthUser,
    Path(id): Path<String>,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<Notification>("notifications");
    let notif_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return ApiResponse::error("Invalid notification ID", StatusCode::BAD_REQUEST),
    };
    let user_id = ObjectId::parse_str(&auth.id).unwrap();

    match collection.update_one(
        doc! { "_id": notif_id, "user_id": user_id },
        doc! { "$set": { "read_status": true } }
    ).await {
        Ok(_) => ApiResponse::success((), "Notification marked as read", StatusCode::OK),
        Err(e) => ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn delete_notification(
    auth: AuthUser,
    Path(id): Path<String>,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<Notification>("notifications");
    let notif_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return ApiResponse::error("Invalid notification ID", StatusCode::BAD_REQUEST),
    };
    let user_id = ObjectId::parse_str(&auth.id).unwrap();

    match collection.delete_one(doc! { "_id": notif_id, "user_id": user_id }).await {
        Ok(_) => ApiResponse::success((), "Notification deleted", StatusCode::OK),
        Err(e) => ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    }
}
