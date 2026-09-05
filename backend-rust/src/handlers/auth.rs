use axum::{
    extract::State,
    http::StatusCode,
    response::Response,
    Json,
};
use bcrypt::verify;
use jsonwebtoken::{encode, Header, EncodingKey};
use mongodb::bson::doc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::db::DbContext;
use crate::models::User;
use crate::utils::ApiResponse;
use crate::middleware::auth::Claims;
use chrono::{Utc, Duration};

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub user: User,
    pub token: String,
}

pub async fn login(
    State(db): State<Arc<DbContext>>,
    Json(payload): Json<LoginRequest>,
) -> Response {
    let collection = db.db.collection::<User>("users");

    let user = match collection.find_one(doc! { "email": &payload.email }).await {
        Ok(Some(u)) => u,
        Ok(None) => return ApiResponse::error("Invalid credentials", StatusCode::UNAUTHORIZED),
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    if !verify(&payload.password, &user.password_hash).unwrap_or(false) {
        return ApiResponse::error("Invalid credentials", StatusCode::UNAUTHORIZED);
    }

    if let crate::models::user::UserStatus::Inactive = user.status {
        return ApiResponse::error("Account is inactive", StatusCode::FORBIDDEN);
    }

    // Generate JWT
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let exp = Utc::now() + Duration::hours(24);
    
    let claims = Claims {
        user_id: user.id.map(|id| id.to_string()),
        id: None,
        email: user.email.clone(),
        role: None,
        app_id: user.app_id.clone(),
        r#type: None,
        exp: exp.timestamp() as usize,
    };

    let token = match encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    ) {
        Ok(t) => t,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    ApiResponse::success(LoginResponse { user, token }, "Login successful", StatusCode::OK)
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub phone_number: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub app_id: Option<String>,
}

pub async fn register(
    State(db): State<Arc<DbContext>>,
    Json(payload): Json<RegisterRequest>,
) -> Response {
    let collection = db.db.collection::<User>("users");

    // Check if user exists
    let existing_filter = doc! {
        "$or": [
            { "email": &payload.email },
            { "phone_number": &payload.phone_number }
        ]
    };

    if let Ok(Some(_)) = collection.find_one(existing_filter).await {
        return ApiResponse::error("User already exists", StatusCode::BAD_REQUEST);
    }

    let password_hash = bcrypt::hash(&payload.password, 10).unwrap();
    let referral_code = format!("REF-{}", Utc::now().timestamp_millis());

    let kyc_status = if let Some(ref app_id) = payload.app_id {
        if app_id == "dadsub" || app_id == "abbasalehsub" {
            crate::models::user::KycStatus::Verified
        } else {
            crate::models::user::KycStatus::Pending
        }
    } else {
        crate::models::user::KycStatus::Pending
    };

    let user = User {
        id: None,
        email: payload.email,
        phone_number: payload.phone_number,
        password_hash,
        first_name: payload.first_name,
        last_name: payload.last_name,
        date_of_birth: None,
        address: None,
        city: None,
        state: None,
        country: "Nigeria".to_string(),
        kyc_status,
        kyc_document_id_front_url: None,
        kyc_document_id_back_url: None,
        referral_code,
        referred_by: None,
        referral_bonus_claimed: false,
        biometric_enabled: false,
        nin: None,
        bvn: None,
        transaction_pin: None,
        profile_picture_url: None,
        virtual_account: None,
        status: crate::models::user::UserStatus::Active,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        app_id: payload.app_id,
    };

    match collection.insert_one(user.clone()).await {
        Ok(_) => ApiResponse::success(user, "Registration successful", StatusCode::CREATED),
        Err(e) => ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    }
}
