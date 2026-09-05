use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Response,
    Json,
};
use futures::TryStreamExt;
use mongodb::bson::{doc, oid::ObjectId};
use serde::Deserialize;
use std::sync::Arc;
use crate::db::DbContext;
use crate::models::{Wallet, Transaction};
use crate::utils::{ApiResponse, PaginationMetadata};
use crate::middleware::auth::AuthUser;
use chrono::Utc;

#[derive(Deserialize)]
pub struct FundWalletRequest {
    pub amount: f64,
    pub payment_method: String,
}

#[derive(Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

pub async fn get_wallet(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<Wallet>("wallets");
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    match collection.find_one(doc! { "user_id": user_id }).await {
        Ok(Some(wallet)) => ApiResponse::success(wallet, "Wallet retrieved successfully", StatusCode::OK),
        Ok(None) => ApiResponse::error("Wallet not found", StatusCode::NOT_FOUND),
        Err(e) => ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn fund_wallet(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Json(payload): Json<FundWalletRequest>,
) -> Response {
    if payload.amount <= 0.0 {
        return ApiResponse::error("Invalid amount", StatusCode::BAD_REQUEST);
    }

    let wallet_coll = db.db.collection::<Wallet>("wallets");
    let trans_coll = db.db.collection::<Transaction>("transactions");
    
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let wallet = match wallet_coll.find_one(doc! { "user_id": user_id }).await {
        Ok(Some(w)) => w,
        _ => return ApiResponse::error("Wallet not found", StatusCode::NOT_FOUND),
    };

    let reference = format!("TXN-{}", Utc::now().timestamp_millis());
    let transaction = Transaction {
        id: None,
        user_id,
        wallet_id: wallet.id.unwrap(),
        r#type: crate::models::transaction::TransactionType::WalletTopup,
        amount: payload.amount,
        fee: 0.0,
        total_charged: payload.amount,
        status: crate::models::transaction::TransactionStatus::Successful,
        reference_number: reference,
        description: Some("Wallet funding".to_string()),
        payment_method: payload.payment_method,
        destination_account: None,
        operator_id: None,
        plan_id: None,
        receipt_url: None,
        error_message: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        app_id: auth.app_id,
    };

    if let Err(e) = wallet_coll.update_one(
        doc! { "_id": wallet.id.unwrap() },
        doc! { "$inc": { "balance": payload.amount }, "$set": { "updated_at": mongodb::bson::DateTime::now() } }
    ).await {
        return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    match trans_coll.insert_one(transaction).await {
        Ok(_) => ApiResponse::success((), "Wallet funded successfully", StatusCode::OK),
        Err(e) => ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn get_wallet_transactions(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Query(q): Query<PaginationQuery>,
) -> Response {
    let wallet_coll = db.db.collection::<Wallet>("wallets");
    let trans_coll = db.db.collection::<Transaction>("transactions");
    
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let wallet = match wallet_coll.find_one(doc! { "user_id": user_id }).await {
        Ok(Some(w)) => w,
        _ => return ApiResponse::error("Wallet not found", StatusCode::NOT_FOUND),
    };

    let page = q.page.unwrap_or(1);
    let limit = q.limit.unwrap_or(10);
    let skip = (page - 1) * limit;

    let filter = doc! { "wallet_id": wallet.id.unwrap() };
    let total = trans_coll.count_documents(filter.clone()).await.unwrap_or(0);

    let find_options = mongodb::options::FindOptions::builder()
        .skip(Some(skip as u64))
        .limit(Some(limit as i64))
        .sort(doc! { "created_at": -1 })
        .build();

    let mut cursor = match trans_coll.find(filter).with_options(Some(find_options)).await {
        Ok(c) => c,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    let mut transactions = Vec::new();
    while let Ok(Some(t)) = cursor.try_next().await {
        transactions.push(t);
    }

    ApiResponse::paginated(
        transactions,
        PaginationMetadata {
            page,
            limit,
            total: total as u64,
            pages: ((total as f64) / (limit as f64)).ceil() as u32,
        },
        "Wallet transactions retrieved successfully",
        StatusCode::OK,
    )
}
