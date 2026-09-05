use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VirtualAccount {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user: ObjectId,
    pub account_number: String,
    pub account_name: String,
    pub bank_name: String,
    pub provider: String,
    pub reference: String,
    pub status: String,
    pub metadata: serde_json::Value,
    pub is_active: bool,
    pub generated_by: Option<ObjectId>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
