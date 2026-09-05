use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
};
use futures::TryStreamExt;
use mongodb::bson::{doc, oid::ObjectId};
use std::sync::Arc;
use crate::db::DbContext;
use crate::models::{VirtualAccount, Transaction};
use crate::utils::ApiResponse;
use crate::middleware::auth::AuthUser;

pub async fn get_virtual_accounts(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<VirtualAccount>("virtualaccounts");
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let mut cursor = match collection.find(doc! { "user": user_id }).await {
        Ok(c) => c,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    let mut accounts = Vec::new();
    while let Ok(Some(a)) = cursor.try_next().await {
        accounts.push(a);
    }

    ApiResponse::success(accounts, "Virtual accounts retrieved", StatusCode::OK)
}

pub async fn get_account_balance(
    _auth: AuthUser,
    Path(account_number): Path<String>,
    State(_db): State<Arc<DbContext>>,
) -> Response {
    ApiResponse::success(doc! { "accountNumber": account_number, "balance": 0.0 }, "Balance retrieved", StatusCode::OK)
}

pub async fn get_transactions(
    auth: AuthUser,
    Path(account_number): Path<String>,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<Transaction>("transactions");
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let filter = doc! { "user_id": user_id, "destination_account": account_number };
    
    let mut cursor = match collection.find(filter).await {
        Ok(c) => c,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    let mut transactions = Vec::new();
    while let Ok(Some(t)) = cursor.try_next().await {
        transactions.push(t);
    }

    ApiResponse::success(transactions, "Transactions retrieved", StatusCode::OK)
}
