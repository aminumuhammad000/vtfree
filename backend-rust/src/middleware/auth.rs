use axum::{
    extract::FromRequestParts,
    http::request::Parts,
    http::StatusCode,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub user_id: Option<String>,
    pub id: Option<String>,
    pub email: String,
    pub role: Option<String>,
    pub app_id: Option<String>,
    pub r#type: Option<String>,
    pub exp: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthUser {
    pub id: String,
    pub email: String,
    pub role: Option<String>,
    pub app_id: Option<String>,
    pub user_type: Option<String>,
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "));

        let token = auth_header.ok_or((StatusCode::UNAUTHORIZED, "No token provided".to_string()))?;
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_ref()),
            &Validation::default(),
        )
        .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid token".to_string()))?;

        let claims = token_data.claims;
        Ok(AuthUser {
            id: claims.user_id.or(claims.id).ok_or((StatusCode::UNAUTHORIZED, "Invalid token claims".to_string()))?,
            email: claims.email,
            role: claims.role,
            app_id: claims.app_id,
            user_type: claims.r#type,
        })
    }
}
