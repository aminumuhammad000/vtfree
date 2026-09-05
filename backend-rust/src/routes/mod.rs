pub mod auth;
pub mod user;
pub mod wallet;
pub mod transaction;
pub mod billpayment;
pub mod notification;
pub mod promotion;
pub mod support;
pub mod support_content;
pub mod admin;
pub mod vtstack;
pub mod webhook;
pub mod super_admin;

use axum::Router;
use std::sync::Arc;
use crate::db::DbContext;

pub fn create_router() -> Router<Arc<DbContext>> {
    Router::new()
        .nest("/api/v1/auth", auth::auth_routes())
        .nest("/api/v1/users", user::user_routes())
        .nest("/api/v1/wallet", wallet::wallet_routes())
        .nest("/api/v1/transactions", transaction::transaction_routes())
        .nest("/api/v1/billpayment", billpayment::billpayment_routes())
        .nest("/api/v1/notifications", notification::notification_routes())
        .nest("/api/v1/promotions", promotion::promotion_routes())
        .nest("/api/v1/support", support::support_routes())
        .nest("/api/v1/support-content", support_content::support_content_routes())
        .nest("/api/v1/dashboard", admin::admin_routes())
        .nest("/api/v1/vtstack", vtstack::vtstack_routes())
        .nest("/api/v1/webhooks", webhook::webhook_routes())
        .nest("/api/v1/super-admin", super_admin::super_admin_routes())
}
