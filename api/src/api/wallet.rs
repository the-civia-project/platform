use crate::api::api::AppState;
use crate::api::common::{full_request_url, parse_citizen_of};
use crate::api::eudi_presentation::{EudiPresentationError, PresentationStatus};

use axum::body::Bytes;
use axum::extract::{DefaultBodyLimit, OriginalUri, Path, State};
use axum::http::HeaderMap;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::response::Response;
use axum::{
    Json, Router,
    routing::{get, post},
};
use serde_json::json;
use uuid::Uuid;

pub fn build_wallet_router() -> Router<AppState> {
    Router::new()
        .route(
            "/wallet/presentation/start/{session_id}",
            get(wallet_presentation_start),
        )
        .route(
            "/wallet/presentation/response/{session_id}",
            post(wallet_presentation_response),
        )
        .route(
            "/wallet/presentation/complete/{session_id}",
            get(presentation_complete),
        )
        .layer(DefaultBodyLimit::max(6 * 1024 * 1024))
}

#[tracing::instrument(fields(%session_id), skip(state))]
async fn wallet_presentation_start(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
) -> Result<Response, EudiPresentationError> {
    tracing::info!("GET /wallet/presentation/start/{session_id}");
    state.eudi.jar_http_response(session_id)
}

#[tracing::instrument(fields(%session_id), skip(state, headers, body))]
async fn wallet_presentation_response(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
    OriginalUri(uri): OriginalUri,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Json<serde_json::Value>, EudiPresentationError> {
    let url = full_request_url(&uri, &headers);
    let body_text = String::from_utf8_lossy(&body);
    let headers_log: Vec<String> = headers
        .iter()
        .map(|(name, value)| format!("{}: {}", name, value.to_str().unwrap_or("<non-utf8>")))
        .collect();

    tracing::info!(
        %session_id,
        %url,
        headers = ?headers_log,
        body = %body_text,
        "POST /wallet/presentation/response"
    );

    state
        .eudi
        .accept_wallet_response(session_id, &headers, &body)?;

    // Session id is the platform user id (see apps/ui eudi presentation request URI).
    let citizen_of = parse_citizen_of(vec![276]).map_err(|_| {
        EudiPresentationError::Internal("Germany country code misconfigured".into())
    })?;

    match state
        .db
        .update_user_citizen_of(session_id, citizen_of)
        .await
    {
        Ok(()) => tracing::info!(
            user_id = %session_id,
            citizen_of = 276,
            "wallet response: set user citizenship to Germany"
        ),
        Err(sqlx::Error::RowNotFound) => tracing::warn!(
            user_id = %session_id,
            "wallet response: platform user not found for citizenship update"
        ),
        Err(err) => {
            tracing::error!(
                error = %err,
                user_id = %session_id,
                "wallet response: failed to update citizenship"
            );
            return Err(EudiPresentationError::Internal(err.to_string()));
        }
    }

    Ok(Json(json!({})))
}

#[tracing::instrument(fields(%session_id), skip(state, headers, body))]
async fn presentation_complete(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
    OriginalUri(uri): OriginalUri,
    headers: HeaderMap,
    body: Bytes,
) -> Result<impl IntoResponse, EudiPresentationError> {
    let url = full_request_url(&uri, &headers);
    let body_text = String::from_utf8_lossy(&body);
    let headers_log: Vec<String> = headers
        .iter()
        .map(|(name, value)| format!("{}: {}", name, value.to_str().unwrap_or("<non-utf8>")))
        .collect();

    tracing::info!(
        %session_id,
        %url,
        headers = ?headers_log,
        body = %body_text,
        "GET /wallet/presentation/complete"
    );

    let view = state.eudi.complete_view(session_id)?;
    let status = match view.status {
        PresentationStatus::Pending => "pending",
        PresentationStatus::ResponseReceived => "response_received",
        PresentationStatus::Verified => "verified",
        PresentationStatus::Failed => "failed",
    };
    let response_body = json!({
        "session_id": view.session_id,
        "status": status,
        "failure_reason": view.failure_reason,
    });
    match view.status {
        PresentationStatus::Pending | PresentationStatus::ResponseReceived => {
            Ok(StatusCode::NO_CONTENT.into_response())
        }
        PresentationStatus::Verified | PresentationStatus::Failed => {
            Ok((StatusCode::OK, Json(response_body)).into_response())
        }
    }
}
