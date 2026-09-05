use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditLog {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub app_id: Option<String>,
    pub admin_id: Option<ObjectId>,
    pub user_id: Option<ObjectId>,
    pub action: String,
    pub entity_type: String,
    pub entity_id: Option<ObjectId>,
    pub old_value: Option<serde_json::Value>,
    pub new_value: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub timestamp: DateTime<Utc>,
}
