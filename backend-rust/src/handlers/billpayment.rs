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
use crate::models::{AirtimePlan, Transaction, User, Wallet};
use crate::utils::{ApiResponse, PaginationMetadata};
use crate::middleware::auth::AuthUser;
use chrono::Utc;

#[derive(Deserialize)]
pub struct PurchaseRequest {
    pub network: Option<String>,
    pub phone: String,
    pub amount: Option<f64>,
    pub plan: Option<String>, // Can be ObjectID or external ID
    pub pin: String,
    pub ported_number: Option<bool>,
}

#[derive(Deserialize)]
pub struct DataPlansQuery {
    pub network: Option<String>,
}

pub async fn get_networks(
    _auth: AuthUser,
    State(_db): State<Arc<DbContext>>,
) -> Response {
    let networks = vec![
        doc! { "id": 1, "name": "MTN" },
        doc! { "id": 2, "name": "Airtel" },
        doc! { "id": 3, "name": "Glo" },
        doc! { "id": 4, "name": "9mobile" },
    ];
    ApiResponse::success(networks, "Networks retrieved successfully", StatusCode::OK)
}

pub async fn get_data_plans(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Query(q): Query<DataPlansQuery>,
) -> Response {
    let collection = db.db.collection::<AirtimePlan>("airtimeplans");
    
    let mut filter = doc! {
        "type": "DATA",
        "active": true,
        "$or": [
            { "app_id": auth.app_id.clone() },
            { "app_id": null },
            { "app_id": { "$exists": false } }
        ]
    };

    if let Some(network) = q.network {
        let provider_id = match network.to_lowercase().as_str() {
            "mtn" => 1,
            "airtel" => 2,
            "glo" => 3,
            "9mobile" => 4,
            _ => return ApiResponse::error("Invalid network", StatusCode::BAD_REQUEST),
        };
        filter.insert("provider_id", provider_id);
    }

    let find_options = mongodb::options::FindOptions::builder()
        .sort(doc! { "provider_id": 1, "price": 1 })
        .build();

    let mut cursor = match collection.find(filter).with_options(Some(find_options)).await {
        Ok(c) => c,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    let mut plans = Vec::new();
    while let Ok(Some(plan)) = cursor.try_next().await {
        plans.push(doc! {
            "plan_id": plan.id.unwrap().to_hex(),
            "network": plan.provider_id,
            "plan_name": plan.name,
            "plan_type": "DATA",
            "price": plan.price,
            "providerName": plan.provider_name,
        });
    }

    ApiResponse::success(plans, "Data plans retrieved successfully", StatusCode::OK)
}

pub async fn purchase_airtime(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Json(payload): Json<PurchaseRequest>,
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

    if user.kyc_status != crate::models::user::KycStatus::Verified {
        return ApiResponse::error("KYC verification required", StatusCode::FORBIDDEN);
    }

    let amount = payload.amount.unwrap_or(0.0);
    if amount <= 0.0 {
        return ApiResponse::error("Invalid amount", StatusCode::BAD_REQUEST);
    }
    
    let wallet = match wallet_coll.find_one(doc! { "user_id": user_id }).await {
        Ok(Some(w)) => w,
        _ => return ApiResponse::error("Wallet not found", StatusCode::NOT_FOUND),
    };

    if wallet.balance < amount {
        return ApiResponse::error("Insufficient balance", StatusCode::BAD_REQUEST);
    }

    let ref_num = format!("AIR-{}", Utc::now().timestamp_millis());
    
    if let Err(e) = wallet_coll.update_one(
        doc! { "_id": wallet.id.unwrap() },
        doc! { "$inc": { "balance": -amount }, "$set": { "updated_at": mongodb::bson::DateTime::now() } }
    ).await {
        return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    let transaction = Transaction {
        id: None,
        user_id,
        wallet_id: wallet.id.unwrap(),
        r#type: crate::models::transaction::TransactionType::AirtimeTopup,
        amount,
        fee: 0.0,
        total_charged: amount,
        status: crate::models::transaction::TransactionStatus::Successful,
        reference_number: ref_num,
        description: Some(format!("Airtime purchase - {}", payload.phone)),
        payment_method: "wallet".to_string(),
        destination_account: Some(payload.phone),
        operator_id: None,
        plan_id: None,
        receipt_url: None,
        error_message: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        app_id: user.app_id,
    };

    match trans_coll.insert_one(transaction).await {
        Ok(_) => ApiResponse::success((), "Airtime purchase successful", StatusCode::OK),
        Err(_) => ApiResponse::error("Transaction record failed", StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn purchase_data(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Json(payload): Json<PurchaseRequest>,
) -> Response {
    let user_coll = db.db.collection::<User>("users");
    let wallet_coll = db.db.collection::<Wallet>("wallets");
    let trans_coll = db.db.collection::<Transaction>("transactions");
    let plan_coll = db.db.collection::<AirtimePlan>("airtimeplans");

    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let user = match user_coll.find_one(doc! { "_id": user_id }).await {
        Ok(Some(u)) => u,
        _ => return ApiResponse::error("User not found", StatusCode::NOT_FOUND),
    };

    let plan_id = payload.plan.as_ref().and_then(|p| ObjectId::parse_str(p).ok());
    if plan_id.is_none() {
        return ApiResponse::error("Invalid plan ID", StatusCode::BAD_REQUEST);
    }

    let plan = match plan_coll.find_one(doc! { "_id": plan_id.unwrap() }).await {
        Ok(Some(p)) => p,
        _ => return ApiResponse::error("Plan not found", StatusCode::NOT_FOUND),
    };

    let amount = plan.price;
    let wallet = match wallet_coll.find_one(doc! { "user_id": user_id }).await {
        Ok(Some(w)) => w,
        _ => return ApiResponse::error("Wallet not found", StatusCode::NOT_FOUND),
    };

    if wallet.balance < amount {
        return ApiResponse::error("Insufficient balance", StatusCode::BAD_REQUEST);
    }

    let ref_num = format!("DATA-{}", Utc::now().timestamp_millis());
    
    if let Err(e) = wallet_coll.update_one(
        doc! { "_id": wallet.id.unwrap() },
        doc! { "$inc": { "balance": -amount }, "$set": { "updated_at": mongodb::bson::DateTime::now() } }
    ).await {
        return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    let transaction = Transaction {
        id: None,
        user_id,
        wallet_id: wallet.id.unwrap(),
        r#type: crate::models::transaction::TransactionType::DataPurchase,
        amount,
        fee: 0.0,
        total_charged: amount,
        status: crate::models::transaction::TransactionStatus::Successful,
        reference_number: ref_num,
        description: Some(format!("Data purchase - {} - {}", plan.name, payload.phone)),
        payment_method: "wallet".to_string(),
        destination_account: Some(payload.phone),
        operator_id: None,
        plan_id: plan.id,
        receipt_url: None,
        error_message: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        app_id: user.app_id,
    };

    match trans_coll.insert_one(transaction).await {
        Ok(_) => ApiResponse::success((), "Data purchase successful", StatusCode::OK),
        Err(_) => ApiResponse::error("Transaction record failed", StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn get_cable_providers(_auth: AuthUser, State(_db): State<Arc<DbContext>>) -> Response {
    let providers = vec![
        doc! { "id": "dstv", "name": "DSTV" },
        doc! { "id": "gotv", "name": "GOTV" },
        doc! { "id": "startimes", "name": "Startimes" },
    ];
    ApiResponse::success(providers, "Cable providers retrieved", StatusCode::OK)
}

pub async fn get_electricity_providers(_auth: AuthUser, State(_db): State<Arc<DbContext>>) -> Response {
    let providers = vec![
        doc! { "id": "eko", "name": "Eko Electric" },
        doc! { "id": "ikeja", "name": "Ikeja Electric" },
    ];
    ApiResponse::success(providers, "Electricity providers retrieved", StatusCode::OK)
}
