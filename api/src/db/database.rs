use crate::db::supported_countries;
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres, postgres::PgPoolOptions};

#[derive(Clone)]
pub struct Database {
    pub pool: Pool<Postgres>,
}

/// Sorted ISO 3166-1 numeric codes for EU members (`public.COUNTRY_NUMERIC_CODE`).
pub fn allowed_country_numeric_codes() -> &'static [i32] {
    supported_countries::allowed_numeric_codes()
}

pub fn is_allowed_country_numeric_code(code: i32) -> bool {
    supported_countries::is_allowed_numeric_code(code)
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, sqlx::Type)]
#[sqlx(transparent)]
#[sqlx(type_name = "COUNTRY_NUMERIC_CODE")]
pub struct CountryNumericCode(i32);

impl CountryNumericCode {
    pub fn new(code: i32) -> Self {
        Self(code)
    }

    pub fn try_new(code: i32) -> Option<Self> {
        if is_allowed_country_numeric_code(code) {
            Some(Self(code))
        } else {
            None
        }
    }

    pub fn code(self) -> i32 {
        self.0
    }
}

/// English ISO 3166-1 short name for an EU numeric code (used when "from" is omitted).
pub fn country_display_name(code: i32) -> Option<&'static str> {
    supported_countries::country_display_name(code)
}

fn resolve_database_url() -> String {
    let url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgres://postgres:postgres@localhost:5432/postgres".to_string()
    });
    let trimmed = url.trim_end_matches('/');
    if trimmed.ends_with(":5432") {
        format!("{trimmed}/postgres")
    } else {
        trimmed.to_string()
    }
}

impl Database {
    pub async fn new() -> Result<Self, sqlx::Error> {
        let database_url = resolve_database_url();
        tracing::debug!("connecting to {}", database_url);

        let pool = PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(std::time::Duration::from_secs(10))
            .connect(&database_url)
            .await?;

        let db = Self { pool };

        db.check_connection().await?;

        tracing::debug!("database connection established");

        Ok(db)
    }

    pub async fn check_connection(&self) -> Result<(), sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT $1")
            .bind(42_i64)
            .fetch_one(&self.pool)
            .await?;

        assert_eq!(row.0, 42);

        Ok(())
    }
}
