use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use mongodb::bson::{doc, oid::ObjectId};
use serde::Deserialize;
use std::sync::Arc;
use crate::db::DbContext;
use crate::models::{AdminUser, User, Transaction};
use crate::utils::ApiResponse;
use crate::middleware::auth::AuthUser;

#[derive(Deserialize)]
pub struct AdminLoginRequest {
    pub email: String,
    pub password: String,
}

pub async fn admin_login(
    State(_db): State<Arc<DbContext>>,
    Json(_payload): Json<AdminLoginRequest>,
) -> Response {
    ApiResponse::success(doc! { "token": "mock-admin-token" }, "Login successful", StatusCode::OK)
}

pub async fn get_dashboard_stats(
    _auth: AuthUser,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let user_coll = db.db.collection::<User>("users");
    let trans_coll = db.db.collection::<Transaction>("transactions");
    
    let total_users = user_coll.count_documents(doc! {}).await.unwrap_or(0);
    let total_transactions = trans_coll.count_documents(doc! {}).await.unwrap_or(0);
    
    let stats = doc! {
        "total_users": total_users as i64,
        "total_transactions": total_transactions as i64,
    };
    
    ApiResponse::success(stats, "Dashboard stats retrieved", StatusCode::OK)
}

pub async fn get_admin_profile(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<AdminUser>("adminusers");
    let admin_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid admin ID", StatusCode::BAD_REQUEST),
    };

    match collection.find_one(doc! { "_id": admin_id }).await {
        Ok(Some(mut admin)) => {
            admin.password_hash = "".to_string();
            ApiResponse::success(admin, "Admin profile retrieved", StatusCode::OK)
        }
        _ => ApiResponse::error("Admin not found", StatusCode::NOT_FOUND),
    }
}
