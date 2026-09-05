use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum TicketPriority {
    Low,
    Medium,
    High,
    Urgent,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "kebab-case")]
pub enum TicketStatus {
    Open,
    InProgress,
    Resolved,
    Closed,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupportTicket {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub app_id: Option<String>,
    pub user_id: ObjectId,
    pub subject: String,
    pub message: String,
    pub category: String,
    #[serde(default = "default_priority")]
    pub priority: TicketPriority,
    #[serde(default = "default_status")]
    pub status: TicketStatus,
    pub ticket_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

fn default_priority() -> TicketPriority { TicketPriority::Medium }
fn default_status() -> TicketStatus { TicketStatus::Open }
