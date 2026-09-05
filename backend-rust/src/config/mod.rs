use serde::Deserialize;
use std::env;

#[derive(Clone, Deserialize)]
pub struct Config {
    pub port: u16,
    pub mongo_uri: String,
    pub database_name: String,
    pub jwt_secret: String,
    pub node_env: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        Self {
            port: env::var("PORT")
                .unwrap_or_else(|_| "5000".to_string())
                .parse()
                .expect("PORT must be a number"),
            mongo_uri: env::var("MONGO_URI").expect("MONGO_URI must be set"),
            database_name: env::var("DATABASE_NAME").unwrap_or_else(|_| "vtfree".to_string()),
            jwt_secret: env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
            node_env: env::var("NODE_ENV").unwrap_or_else(|_| "development".to_string()),
        }
    }
}
