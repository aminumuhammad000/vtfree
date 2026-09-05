use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum PromotionType {
    Discount,
    Cashback,
    ReferralBonus,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum PromotionStatus {
    Active,
    Inactive,
    Ended,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Promotion {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub name: String,
    pub description: Option<String>,
    pub r#type: PromotionType,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub code: Option<String>,
    #[serde(default = "default_promo_status")]
    pub status: PromotionStatus,
    pub target_users: String,
    pub banner_image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

fn default_promo_status() -> PromotionStatus { PromotionStatus::Active }
