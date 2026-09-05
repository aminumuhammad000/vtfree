use axum::{
    routing::{get, post, put},
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::user;

pub fn user_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/profile", get(user::get_profile).put(user::update_profile))
        .route("/kyc", post(user::upload_kyc))
        .route("/transaction-pin", post(user::set_transaction_pin))
        .route("/referrals", get(user::get_referrals))
        .route("/", get(user::get_all_users))
}
