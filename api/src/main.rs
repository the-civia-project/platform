mod api;
mod db;
mod random;
mod storage;
mod validation;

use crate::api::api::{AppState, start_api};
use crate::api::eudi_presentation::EudiPresentationService;
use crate::db::database::Database;
use crate::storage::AvatarStore;
use clerk_rs::ClerkConfiguration;
use clerk_rs::clerk::Clerk;

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
            eprintln!("S3 storage connection failed: {err}");
            eprintln!();
            eprintln!("Set S3_ENDPOINT, S3_IAM_ENDPOINT, S3_STS_ENDPOINT, S3_ACCESS_KEY,");
            eprintln!("S3_SECRET_KEY, and S3_AVATAR_BUCKET in .env (see .env.example). Local dev:");
            eprintln!("  docker compose up -d");
            std::process::exit(1);
        }
    };

    let clerk = clerk_from_env();

    let eudi = match EudiPresentationService::from_env() {
        Ok(service) => service,
        Err(err) => {
            eprintln!("EUDI presentation setup failed: {err}");
            eprintln!(
                "Set EUDI_ACCESS_CERT_PATH + EUDI_ACCESS_CERT_KEY_PATH, or EUDI_DEV_INSECURE_SIGNING=1 for local dev."
            );
            std::process::exit(1);
        }
    };

    start_api(AppState {
        db,
        avatars,
        clerk,
        eudi,
    })
    .await;
}

pub fn clerk_from_env() -> Clerk {
    let secret = std::env::var("CLERK_SECRET_KEY").expect("CLERK_SECRET_KEY must be set");
    let config = ClerkConfiguration::new(None, None, Some(secret), None);
    Clerk::new(config)
}
