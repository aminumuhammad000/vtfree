use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Notification {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user_id: Option<ObjectId>,
    pub r#type: String,
    pub title: String,
    pub message: String,
    #[serde(default)]
    pub read_status: bool,
    pub created_at: DateTime<Utc>,
    pub action_link: Option<String>,
}
