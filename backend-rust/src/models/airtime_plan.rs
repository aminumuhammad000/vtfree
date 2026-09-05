use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PlanType {
    Airtime,
    Data,
    Cable,
    Utility,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AirtimePlan {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub app_id: Option<String>,
    pub provider_id: u32,
    pub provider_name: String,
    pub external_plan_id: Option<String>,
    pub code: Option<String>,
    pub name: String,
    pub price: f64,
    pub r#type: PlanType,
    #[serde(default)]
    pub discount: f64,
    pub source_provider: Option<String>,
    pub meta: Option<serde_json::Value>,
    #[serde(default = "default_active")]
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

fn default_active() -> bool { true }
