use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::db::DbContext;
use crate::handlers::billpayment;

pub fn billpayment_routes() -> Router<Arc<DbContext>> {
    Router::new()
        .route("/networks", get(billpayment::get_networks))
        .route("/data-plans", get(billpayment::get_data_plans))
        .route("/cable-providers", get(billpayment::get_cable_providers))
        .route("/electricity-providers", get(billpayment::get_electricity_providers))
        .route("/airtime", post(billpayment::purchase_airtime))
        .route("/data", post(billpayment::purchase_data))
}
