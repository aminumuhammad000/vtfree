use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use futures::TryStreamExt;
use mongodb::bson::{doc, oid::ObjectId};
use serde::Deserialize;
use std::sync::Arc;
use crate::db::DbContext;
use crate::models::{SupportTicket, support_ticket::{TicketPriority, TicketStatus}};
use crate::utils::ApiResponse;
use crate::middleware::auth::AuthUser;
use chrono::Utc;

#[derive(Deserialize)]
pub struct CreateTicketRequest {
    pub subject: String,
    pub message: String,
    pub category: String,
    pub priority: Option<TicketPriority>,
}

pub async fn create_ticket(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
    Json(payload): Json<CreateTicketRequest>,
) -> Response {
    let collection = db.db.collection::<SupportTicket>("supporttickets");
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let ticket_id = format!("TKT-{}", Utc::now().timestamp_millis());
    let ticket = SupportTicket {
        id: None,
        app_id: auth.app_id,
        user_id,
        subject: payload.subject,
        message: payload.message,
        category: payload.category,
        priority: payload.priority.unwrap_or(TicketPriority::Medium),
        status: TicketStatus::Open,
        ticket_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    match collection.insert_one(ticket.clone()).await {
        Ok(res) => {
            let mut t = ticket;
            t.id = Some(res.inserted_id.as_object_id().unwrap());
            ApiResponse::success(t, "Ticket created successfully", StatusCode::CREATED)
        }
        Err(e) => ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn get_tickets(
    auth: AuthUser,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<SupportTicket>("supporttickets");
    let user_id = match ObjectId::parse_str(&auth.id) {
        Ok(id) => id,
        Err(_) => return ApiResponse::error("Invalid user ID", StatusCode::BAD_REQUEST),
    };

    let mut cursor = match collection.find(doc! { "user_id": user_id }).await {
        Ok(c) => c,
        Err(e) => return ApiResponse::error(&e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    };

    let mut tickets = Vec::new();
    while let Ok(Some(t)) = cursor.try_next().await {
        tickets.push(t);
    }

    ApiResponse::success(tickets, "Tickets retrieved successfully", StatusCode::OK)
}

pub async fn get_ticket_by_id(
    auth: AuthUser,
    Path(id): Path<String>,
    State(db): State<Arc<DbContext>>,
) -> Response {
    let collection = db.db.collection::<SupportTicket>("supporttickets");
    let ticket_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return ApiResponse::error("Invalid ticket ID", StatusCode::BAD_REQUEST),
    };
    let user_id = ObjectId::parse_str(&auth.id).unwrap();

    match collection.find_one(doc! { "_id": ticket_id, "user_id": user_id }).await {
        Ok(Some(t)) => ApiResponse::success(t, "Ticket retrieved successfully", StatusCode::OK),
        _ => ApiResponse::error("Ticket not found", StatusCode::NOT_FOUND),
    }
}
