use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum SuperAdminStatus {
    Active,
    Suspended,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SuperAdmin {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub email: String,
    pub password_hash: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    #[serde(default = "default_role")]
    pub role: String,
    pub permissions: Vec<String>,
    #[serde(default = "default_status")]
    pub status: SuperAdminStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
}

fn default_role() -> String { "super_admin".to_string() }
fn default_status() -> SuperAdminStatus { SuperAdminStatus::Active }
