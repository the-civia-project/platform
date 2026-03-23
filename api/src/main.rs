mod api;
mod db;
mod random;
mod storage;
mod validation;

use crate::api::{clerk_from_env, start_api, AppState};
use crate::db::database::Database;
use crate::storage::AvatarStore;

fn load_env() {
    let _ = dotenvy::dotenv();
    let _ = dotenvy::from_filename("../.env");
}

#[tokio::main]
async fn main() {
    load_env();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                tracing_subscriber::EnvFilter::new("api=debug,tower_http=debug,sqlx=warn")
            }),
        )
        .init();

    let db = match Database::new().await {
        Ok(db) => db,
        Err(err) => {
            eprintln!("Database connection failed: {err}");
            eprintln!();
            eprintln!("Start Postgres from the repo root:");
            eprintln!("  docker compose up -d");
            eprintln!();
            eprintln!("Then apply migrations:");
            eprintln!("  cd migrations && ./migrate.sh up");
            std::process::exit(1);
        }
    };

    let avatars = match AvatarStore::from_env().await {
        Ok(store) => store,
        Err(err) => {
            eprintln!("MinIO connection failed: {err}");
            eprintln!();
            eprintln!("Start MinIO from the repo root:");
            eprintln!("  docker compose up -d");
            std::process::exit(1);
        }
    };

    let clerk = clerk_from_env();

    start_api(AppState { db, avatars }, clerk).await;
}
