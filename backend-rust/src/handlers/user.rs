use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    Json,
};
use futures::TryStreamExt;
use mongodb::bson::{doc, oid::ObjectId};
use serde::Deserialize;
use std::sync::Arc;
use crate::db::DbContext;
use crate::models::User;
use crate::utils::{ApiResponse, PaginationMetadata};
use crate::middleware::auth::AuthUser;
use chrono::Utc;

#[derive(Deserialize)]
pub struct UpdateProfileRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub date_of_birth: Option<chrono::DateTime<Utc>>,
    pub phone_number: Option<String>,
    pub bvn: Option<String>,
    pub nin: Option<String>,
}

#[derive(Deserialize)]
pub struct KycUploadRequest {
    pub kyc_document_id_front_url: String,
    pub kyc_document_id_back_url: String,
}

#[derive(Deserialize)]
pub struct PinRequest {
    pub pin: String,
}

#[derive(Deserialize)]
pub struct UpdatePinRequest {
    pub current_pin: Option<String>,
    pub new_pin: String,
}

#[derive(Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
}

pub async fn get_profile(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<User>("users");
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    match collection.find_one(doc! { "_id": user_id }).await {
        Ok(Some(mut user)) => {
            user.password_hash = "".to_string();
            ApiResponse::success(user, "Profile retrieved successfully", StatusCode::OK)
        }
        Ok(None) => ApiResponse::error("User not found", StatusCode::NOT_FOUND),
        Err(e) => ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn update_profile(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Json(payload): Json<UpdateProfileRequest>,
) -> Response {
    let collection = db.db.collection::<User>("users");
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let mut update_doc = doc! {};
    if let Some(f) = payload.first_name { update_doc.insert("first_name", f); }
    if let Some(l) = payload.last_name { update_doc.insert("last_name", l); }
    if let Some(a) = payload.address { update_doc.insert("address", a); }
    if let Some(c) = payload.city { update_doc.insert("city", c); }
    if let Some(s) = payload.state { update_doc.insert("state", s); }
    if let Some(ph) = payload.phone_number { update_doc.insert("phone_number", ph); }
    if let Some(b) = payload.bvn { update_doc.insert("bvn", b); }
    if let Some(n) = payload.nin { update_doc.insert("nin", n); }
    
    update_doc.insert("updated_at", mongodb::bson::DateTime::now());

    match collection.find_one_and_update(
        doc! { "_id": user_id },
        doc! { "$set": update_doc }
    ).await {
        Ok(Some(mut user)) => {
            user.password_hash = "".to_string();
            ApiResponse::success(user, "Profile updated successfully", StatusCode::OK)
        }
        Ok(None) => ApiResponse::error("User not found", StatusCode::NOT_FOUND),
        Err(e) => ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn set_transaction_pin(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Json(payload): Json<PinRequest>,
) -> Response {
    if payload.pin.len() != 4 || !payload.pin.chars().all(|c| c.is_digit(10)) {
        return ApiResponse::error("PIN must be a 4-digit number", StatusCode::BAD_REQUEST);
    }

    let collection = db.db.collection::<User>("users");
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let user = match collection.find_one(doc! { "_id": user_id }).await {
        Ok(Some(u)) => u,
        _ => return ApiResponse::error("User not found", StatusCode::NOT_FOUND),
    };

    if user.transaction_pin.is_some() {
        return ApiResponse::error("Transaction PIN already set", StatusCode::BAD_REQUEST);
    }

    let hashed_pin = match bcrypt::hash(&payload.pin, 10) {
        Ok(h) => h,
        Err(_) => return ApiResponse::error("Internal error", StatusCode::INTERNAL_SERVER_ERROR),
    };

    match collection.update_one(
        doc! { "_id": user_id },
        doc! { "$set": { "transaction_pin": hashed_pin, "updated_at": mongodb::bson::DateTime::now() } }
    ).await {
        Ok(_) => ApiResponse::success((), "Transaction PIN set successfully", StatusCode::OK),
        Err(e) => ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn upload_kyc(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Json(payload): Json<KycUploadRequest>,
) -> Response {
    let collection = db.db.collection::<User>("users");
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let kyc_status = if auth.app_id.as_deref() == Some("dadsub") || auth.app_id.as_deref() == Some("abbasalehsub") {
        "verified"
    } else {
        "pending"
    };

    let update = doc! {
        "$set": {
            "kyc_document_id_front_url": payload.kyc_document_id_front_url,
            "kyc_document_id_back_url": payload.kyc_document_id_back_url,
            "kyc_status": kyc_status,
            "updated_at": mongodb::bson::DateTime::now()
        }
    };

    match collection.find_one_and_update(doc! { "_id": user_id }, update).await {
        Ok(Some(mut user)) => {
            user.password_hash = "".to_string();
            ApiResponse::success(user, "KYC documents uploaded successfully", StatusCode::OK)
        }
        _ => ApiResponse::error("User not found", StatusCode::NOT_FOUND),
    }
}

pub async fn get_all_users(
    _auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Query(q): Query<PaginationQuery>,
) -> Response {
    let collection = db.db.collection::<User>("users");
    let page = q.page.unwrap_or(1);
    let limit = q.limit.unwrap_or(10);
    let skip = (page - 1) * limit;

    let mut filter = doc! {};
    if let Some(s) = q.search {
        filter.insert("$or", vec![
            doc! { "first_name": { "$regex": &s, "$options": "i" } },
            doc! { "last_name": { "$regex": &s, "$options": "i" } },
            doc! { "email": { "$regex": &s, "$options": "i" } },
        ]);
    }

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

    let mut users = Vec::new();
    while let Ok(Some(mut user)) = cursor.try_next().await {
        user.password_hash = "".to_string();
        users.push(user);
    }

    ApiResponse::paginated(
        users,
        PaginationMetadata {
            page,
            limit,
            total,
            pages: ((total as f64) / (limit as f64)).ceil() as u32,
        },
        "Users retrieved successfully",
        StatusCode::OK,
    )
}

pub async fn get_referrals(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<User>("users");
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let mut cursor = match collection.find(doc! { "referred_by": user_id }).await {
        Ok(c) => c,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    let mut referrals = Vec::new();
    while let Ok(Some(mut user)) = cursor.try_next().await {
        user.password_hash = "".to_string();
        referrals.push(user);
    }

    ApiResponse::success(referrals, "Referrals retrieved successfully", StatusCode::OK)
}
