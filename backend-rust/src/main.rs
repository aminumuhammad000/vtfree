mod config;
mod db;
mod models;
mod middleware;
mod handlers;
mod routes;
mod utils;

use std::net::SocketAddr;
use std::sync::Arc;
use crate::config::Config;
use crate::db::DbContext;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    println!("Starting server...");
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "backend_rust=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env();
    
    // Initialize Database
    let db_context = DbContext::init(&config)
        .await
        .expect("Failed to connect to MongoDB");

    let db_context = Arc::new(db_context);

    // Create Router
    let app = routes::create_router()
        .with_state(db_context);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
