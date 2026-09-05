use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum TransactionType {
    #[serde(rename = "airtime_topup")]
    AirtimeTopup,
    #[serde(rename = "data_purchase")]
    DataPurchase,
    #[serde(rename = "bill_payment")]
    BillPayment,
    #[serde(rename = "wallet_topup")]
    WalletTopup,
    #[serde(rename = "e-pin_purchase")]
    EPinPurchase,
    #[serde(rename = "referral_bonus")]
    ReferralBonus,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum TransactionStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "successful")]
    Successful,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "refunded")]
    Refunded,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transaction {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user_id: ObjectId,
    pub wallet_id: ObjectId,
    pub r#type: TransactionType,
    pub amount: f64,
    pub fee: f64,
    pub total_charged: f64,
    pub status: TransactionStatus,
    pub reference_number: String,
    pub description: Option<String>,
    pub payment_method: String,
    pub destination_account: Option<String>,
    pub operator_id: Option<ObjectId>,
    pub plan_id: Option<ObjectId>,
    pub receipt_url: Option<String>,
    pub error_message: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub app_id: Option<String>,
}
