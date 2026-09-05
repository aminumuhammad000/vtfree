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
use crate::models::{Transaction, User, Wallet};
use crate::utils::{ApiResponse, PaginationMetadata};
use crate::middleware::auth::AuthUser;
use chrono::Utc;

#[derive(Deserialize)]
pub struct CreateTransactionRequest {
    pub r#type: String,
    pub amount: f64,
    pub destination_account: Option<String>,
    pub operator_id: Option<ObjectId>,
    pub plan_id: Option<ObjectId>,
    pub payment_method: String,
}

#[derive(Deserialize)]
pub struct TransactionQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub status: Option<String>,
    pub r#type: Option<String>,
    pub user_id: Option<String>,
    pub search: Option<String>,
}

pub async fn create_transaction(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Json(payload): Json<CreateTransactionRequest>,
) -> Response {
    let user_coll = db.db.collection::<User>("users");
    let wallet_coll = db.db.collection::<Wallet>("wallets");
    let trans_coll = db.db.collection::<Transaction>("transactions");

    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let user = match user_coll.find_one(doc! { "_id": user_id }).await {
        Ok(Some(u)) => u,
        _ => return ApiResponse::error("User not found", StatusCode::NOT_FOUND),
    };

    let wallet = match wallet_coll.find_one(doc! { "user_id": user_id }).await {
        Ok(Some(w)) => w,
        _ => return ApiResponse::error("Wallet not found", StatusCode::NOT_FOUND),
    };

    let fee = payload.amount * 0.01;
    let total_charged = payload.amount + fee;

    if wallet.balance < total_charged {
        return ApiResponse::error("Insufficient balance", StatusCode::BAD_REQUEST);
    }

    let trans_type = match payload.r#type.as_str() {
        "airtime_topup" => crate::models::transaction::TransactionType::AirtimeTopup,
        "data_purchase" => crate::models::transaction::TransactionType::DataPurchase,
        "bill_payment" => crate::models::transaction::TransactionType::BillPayment,
        "wallet_topup" => crate::models::transaction::TransactionType::WalletTopup,
        "e-pin_purchase" => crate::models::transaction::TransactionType::EPinPurchase,
        "referral_bonus" => crate::models::transaction::TransactionType::ReferralBonus,
        _ => return ApiResponse::error("Invalid transaction type", StatusCode::BAD_REQUEST),
    };

    let transaction = Transaction {
        id: None,
        user_id,
        wallet_id: wallet.id.unwrap(),
        r#type: trans_type,
        amount: payload.amount,
        fee,
        total_charged,
        status: crate::models::transaction::TransactionStatus::Successful,
        reference_number: format!("TXN-{}", Utc::now().timestamp_millis()),
        description: Some(format!("{} for {}", payload.r#type, payload.destination_account.clone().unwrap_or_default())),
        payment_method: payload.payment_method,
        destination_account: payload.destination_account,
        operator_id: payload.operator_id,
        plan_id: payload.plan_id,
        receipt_url: None,
        error_message: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        app_id: user.app_id,
    };

    if let Err(e) = wallet_coll.update_one(
        doc! { "_id": wallet.id.unwrap() },
        doc! { "$inc": { "balance": -total_charged }, "$set": { "updated_at": mongodb::bson::DateTime::now() } }
    ).await {
        return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    match trans_coll.insert_one(transaction.clone()).await {
        Ok(res) => {
            let mut t = transaction;
            t.id = Some(res.inserted_id.as_object_id().unwrap());
            ApiResponse::success(t, "Transaction created successfully", StatusCode::CREATED)
        }
        Err(e) => ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn get_transactions(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Query(q): Query<TransactionQuery>,
) -> Response {
    let collection = db.db.collection::<Transaction>("transactions");
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

    let mut transactions = Vec::new();
    while let Ok(Some(t)) = cursor.try_next().await {
        transactions.push(t);
    }

    ApiResponse::paginated(
        transactions,
        PaginationMetadata {
            page,
            limit,
            total,
            pages: ((total as f64) / (limit as f64)).ceil() as u32,
        },
        "Transactions retrieved successfully",
        StatusCode::OK,
    )
}

pub async fn get_transaction_by_id(
    auth: AuthUser,
    Path(id): Path<String>,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<Transaction>("transactions");
    let trans_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return ApiResponse::error("Invalid transaction ID", StatusCode::BAD_REQUEST),
    };

    let mut filter = doc! { "_id": trans_id };
    if let Some(app_id) = auth.app_id {
        filter.insert("app_id", app_id);
    } else {
        let user_id = ObjectId::parse_str(&auth.id).unwrap();
        filter.insert("user_id", user_id);
    }

    match collection.find_one(filter).await {
        Ok(Some(t)) => ApiResponse::success(t, "Transaction retrieved successfully", StatusCode::OK),
        _ => ApiResponse::error("Transaction not found", StatusCode::NOT_FOUND),
    }
}
