use mongodb::{options::ClientOptions, Client, Database};
use crate::config::Config;

pub struct DbContext {
    pub client: Client,
    pub db: Database,
}

impl DbContext {
    pub async fn init(config: &Config) -> Result<Self, mongodb::error::Error> {
        let client_options = ClientOptions::parse(&config.mongo_uri).await?;
        let client = Client::with_options(client_options)?;
        let db = client.database(&config.database_name);
        
        // Ping the server to ensure connection is active
        db.run_command(mongodb::bson::doc! {"ping": 1}).await?;
        println!("Connected successfully to MongoDB");

        Ok(Self { client, db })
    }
}
