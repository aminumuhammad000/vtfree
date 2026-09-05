use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum KycStatus {
    Pending,
    Verified,
    Rejected,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum UserStatus {
    Active,
    Inactive,
    Suspended,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub email: String,
    pub phone_number: String,
    pub password_hash: String,
    pub first_name: String,
    pub last_name: String,
    pub date_of_birth: Option<DateTime<Utc>>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: String,
    pub kyc_status: KycStatus,
    pub kyc_document_id_front_url: Option<String>,
    pub kyc_document_id_back_url: Option<String>,
    pub referral_code: String,
    pub referred_by: Option<ObjectId>,
    #[serde(default)]
    pub referral_bonus_claimed: bool,
    #[serde(default)]
    pub biometric_enabled: bool,
    pub nin: Option<String>,
    pub bvn: Option<String>,
    pub transaction_pin: Option<String>,
    pub profile_picture_url: Option<String>,
    pub virtual_account: Option<String>,
    pub status: UserStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub app_id: Option<String>,
}
