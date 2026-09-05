use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Response,
    Json,
};
use futures::TryStreamExt;
use mongodb::bson::doc;
use serde::Deserialize;
use std::sync::Arc;
use crate::db::DbContext;
use crate::models::{User, Transaction, AuditLog};
use crate::utils::ApiResponse;
use crate::middleware::auth::AuthUser;

#[derive(Deserialize)]
pub struct SuperAdminLoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct PaginationQuery {
    pub limit: Option<i64>,
    pub offset: Option<u64>,
    pub search: Option<String>,
}

pub async fn login(
    State(_db): State<Arc<DbContext>>,
    Json(_payload): Json<SuperAdminLoginRequest>,
) -> Response {
    ApiResponse::success(doc! { "token": "mock-super-admin-token" }, "Login successful", StatusCode::OK)
}

pub async fn get_dashboard_stats(
    _auth: AuthUser,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let user_coll = db.db.collection::<User>("users");
    let trans_coll = db.db.collection::<Transaction>("transactions");

    let total_users = user_coll.count_documents(doc! {}).await.unwrap_or(0);
    let total_transactions = trans_coll.count_documents(doc! {}).await.unwrap_or(0);
    let active_users = user_coll.count_documents(doc! { "status": "active" }).await.unwrap_or(0);

    let stats = doc! {
        "total_users": total_users as i64,
        "total_transactions": total_transactions as i64,
        "active_users": active_users as i64,
    };

    ApiResponse::success(stats, "Dashboard stats retrieved", StatusCode::OK)
}

pub async fn get_all_users(
    _auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Query(q): Query<PaginationQuery>,
) -> Response {
    let collection = db.db.collection::<User>("users");
    let mut filter = doc! {};
    if let Some(search) = q.search {
        filter.insert("$or", vec![
            doc! { "first_name": { "$regex": &search, "$options": "i" } },
            doc! { "last_name": { "$regex": &search, "$options": "i" } },
            doc! { "email": { "$regex": &search, "$options": "i" } },
        ]);
    }

    let mut cursor = match collection.find(filter).await {
        Ok(c) => c,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    let mut users = Vec::new();
    while let Ok(Some(u)) = cursor.try_next().await {
        users.push(u);
    }

    ApiResponse::success(users, "Users retrieved", StatusCode::OK)
}

pub async fn get_all_transactions(
    _auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Query(q): Query<PaginationQuery>,
) -> Response {
    let collection = db.db.collection::<Transaction>("transactions");
    let limit = q.limit.unwrap_or(50);
    let offset = q.offset.unwrap_or(0);

    let find_options = mongodb::options::FindOptions::builder()
        .limit(Some(limit))
        .skip(Some(offset))
        .sort(doc! { "created_at": -1 })
        .build();

    let mut cursor = match collection.find(doc! {}).with_options(Some(find_options)).await {
        Ok(c) => c,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    let mut transactions = Vec::new();
    while let Ok(Some(t)) = cursor.try_next().await {
        transactions.push(t);
    }

    ApiResponse::success(transactions, "Transactions retrieved", StatusCode::OK)
}

pub async fn get_system_settings(
    _auth: AuthUser,
    State(_db): State<Arc<DbContext>>,
) -> Response {
    let settings = doc! {
        "general": { "companyName": "VTStack Systems" }
    };
    ApiResponse::success(settings, "Settings retrieved", StatusCode::OK)
}

pub async fn get_logs(
    _auth: AuthUser,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<AuditLog>("auditlogs");
    let find_options = mongodb::options::FindOptions::builder()
        .limit(Some(100))
        .sort(doc! { "timestamp": -1 })
        .build();

    let mut cursor = match collection.find(doc! {}).with_options(Some(find_options)).await {
        Ok(c) => c,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    let mut logs = Vec::new();
    while let Ok(Some(l)) = cursor.try_next().await {
        logs.push(l);
    }

    ApiResponse::success(logs, "Logs retrieved", StatusCode::OK)
}
