use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Wallet {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user_id: ObjectId,
    #[serde(default = "default_balance")]
    pub balance: f64,
    #[serde(default = "default_currency")]
    pub currency: String,
    pub last_transaction_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

fn default_balance() -> f64 { 0.0 }
fn default_currency() -> String { "NGN".to_string() }
