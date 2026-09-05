use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
}

#[derive(Serialize)]
pub struct PaginationMetadata {
    pub page: u32,
    pub limit: u32,
    pub total: u64,
    pub pages: u32,
}

#[derive(Serialize)]
pub struct PaginatedResponse<T> {
    pub success: bool,
    pub message: String,
    pub data: Vec<T>,
    pub pagination: PaginationMetadata,
}

impl ApiResponse<()> {
    pub fn error(message: &str, status: StatusCode) -> Response {
        (
            status,
            Json(ApiResponse::<()> {
                success: false,
                message: message.to_string(),
                data: None,
            }),
        )
            .into_response()
    }
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(data: T, message: &str, status: StatusCode) -> Response {
        (
            status,
            Json(ApiResponse {
                success: true,
                message: message.to_string(),
                data: Some(data),
            }),
        )
            .into_response()
    }

    pub fn paginated(
        data: Vec<T>,
        meta: PaginationMetadata,
        message: &str,
        status: StatusCode,
    ) -> Response {
        (
            status,
            Json(PaginatedResponse {
                success: true,
                message: message.to_string(),
                data,
                pagination: meta,
            }),
        )
            .into_response()
    }
}
