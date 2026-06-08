use crate::db::database::{country_display_name, CountryNumericCode};
use crate::validation::is_valid_location;

use axum::http::StatusCode;
use axum::http::{HeaderMap, Uri};

pub fn full_request_url(uri: &Uri, headers: &HeaderMap) -> String {
    let scheme = headers
        .get("x-forwarded-proto")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("http");
    let host = headers
        .get("x-forwarded-host")
        .or_else(|| headers.get("host"))
        .and_then(|v| v.to_str().ok())
        .unwrap_or("localhost");
    let path_and_query = uri
        .path_and_query()
        .map(|path_and_query| path_and_query.as_str())
        .unwrap_or_else(|| uri.path());
    format!("{scheme}://{host}{path_and_query}")
}

pub fn parse_citizen_of(codes: Vec<i32>) -> Result<Vec<CountryNumericCode>, StatusCode> {
    codes
        .into_iter()
        .map(|code| CountryNumericCode::try_new(code).ok_or(StatusCode::BAD_REQUEST))
        .collect()
}

pub fn resolve_location(
    location: Option<String>,
    citizen_of: &[CountryNumericCode],
) -> Result<Option<String>, StatusCode> {
    if let Some(raw) = location {
        let trimmed = raw.trim();
        if !trimmed.is_empty() {
            if !is_valid_location(trimmed) {
                return Err(StatusCode::BAD_REQUEST);
            }
            return Ok(Some(trimmed.to_string()));
        }
    }

    let Some(code) = citizen_of.first() else {
        return Ok(None);
    };

    country_display_name(code.code())
        .map(|name| Some(name.to_string()))
        .ok_or(StatusCode::BAD_REQUEST)
}
