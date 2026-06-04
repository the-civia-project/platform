use crate::db::database::{CountryNumericCode, Database, country_display_name};
use crate::db::user::{CreateUser, User, ValidationType};
use crate::storage::{AvatarStore, avatar_public_url, validate_avatar_key};
use crate::validation::{is_valid_handle, is_valid_location};
use axum::body::Body;
use axum::extract::rejection::JsonRejection;
use axum::extract::{DefaultBodyLimit, Extension, Multipart, Path, State};
use axum::http::StatusCode;
use axum::http::header::{CACHE_CONTROL, CONTENT_TYPE};
use axum::response::IntoResponse;
use axum::response::Response;
use axum::{
    Json, Router,
    middleware::{self, Next},
    routing::{delete, get, post},
};
use axum_extra::extract::WithRejection;
use clerk_rs::ClerkConfiguration;
use clerk_rs::apis::users_api::User as ClerkUsersApi;
use clerk_rs::clerk::Clerk;
use clerk_rs::validators::authorizer::ClerkJwt;
use clerk_rs::validators::{axum::ClerkLayer, jwks::MemoryCacheJwksProvider};
use serde::Deserialize;
use serde::Serialize;
use serde_json::json;
use thiserror::Error;
use tower_http::cors::CorsLayer;
use uuid::Uuid;

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub avatars: AvatarStore,
    pub clerk: Clerk,
}

pub fn build_router(state: AppState) -> Router {
    let clerk_layer = ClerkLayer::new(
        MemoryCacheJwksProvider::new(state.clerk.clone()),
        Some(vec![
            "/register".into(),
            "/me".into(),
            "/account".into(),
            "/account/avatar".into(),
        ]),
        false,
    );

    let public = Router::new()
        .route("/health", get(health))
        .route("/media/avatars/{*key}", get(serve_avatar))
        .layer(DefaultBodyLimit::max(6 * 1024 * 1024));

    let protected = Router::new()
        .route("/register", post(register))
        .route("/me", get(me))
        .route("/account", delete(delete_account))
        .route("/account/avatar", post(upload_avatar))
        .layer(DefaultBodyLimit::max(6 * 1024 * 1024))
        .layer(clerk_layer);

    Router::new()
        .merge(public)
        .merge(protected)
        .layer(middleware::from_fn(log_requests))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn log_requests(request: axum::http::Request<Body>, next: Next) -> Response {
    let method = request.method().clone();
    let target = request
        .uri()
        .path_and_query()
        .map(|path_and_query| path_and_query.as_str())
        .unwrap_or_else(|| request.uri().path())
        .to_string();

    let response = next.run(request).await;

    tracing::info!("{} {} {}", method, target, response.status().as_u16());

    response
}

pub async fn start_api(state: AppState) {
    let app = build_router(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();

    tracing::debug!("listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap();
}

impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            ApiError::JsonExtractorRejection(json_rejection) => {
                (json_rejection.status(), json_rejection.body_text())
            }
        };

        let payload = json!({
            "message": message,
        });

        tracing::warn!("api error: {}", message);

        (status, Json(payload)).into_response()
    }
}

#[derive(Debug, Error)]
pub enum ApiError {
    #[error(transparent)]
    JsonExtractorRejection(#[from] JsonRejection),
}

#[derive(Deserialize)]
struct RegisterPayload {
    citizen_of: Vec<i32>,
    handle: Option<String>,
    location: Option<String>,
    avatar_key: Option<String>,
}

#[derive(Serialize)]
struct UserResponse {
    user_id: Uuid,
    citizen_of: Vec<i32>,
    tag_label: String,
    tag_discriminator: i32,
    handle: Option<String>,
    name: Option<String>,
    location: Option<String>,
    avatar_key: Option<String>,
    avatar_url: Option<String>,
}

fn user_response(user: User) -> UserResponse {
    let avatar_key = user.avatar.clone();
    let avatar_url = avatar_key.as_deref().map(avatar_public_url);
    UserResponse {
        user_id: user.id,
        citizen_of: user.citizen_of.iter().map(|c| c.code()).collect(),
        tag_label: user.tag.label.clone(),
        tag_discriminator: user.tag.discriminator,
        handle: user.handle,
        name: user.name,
        location: user.location,
        avatar_key,
        avatar_url,
    }
}

#[derive(Serialize)]
struct AvatarUploadResponse {
    avatar_key: String,
    avatar_url: String,
}

fn parse_citizen_of(codes: Vec<i32>) -> Result<Vec<CountryNumericCode>, StatusCode> {
    if codes.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    codes
        .into_iter()
        .map(|code| CountryNumericCode::try_new(code).ok_or(StatusCode::BAD_REQUEST))
        .collect()
}

fn parse_avatar_key(key: Option<String>) -> Result<Option<String>, StatusCode> {
    let Some(key) = key else {
        return Ok(None);
    };
    validate_avatar_key(&key).map_err(|_| StatusCode::BAD_REQUEST)?;
    Ok(Some(key))
}

fn parse_handle(handle: Option<String>) -> Result<Option<String>, StatusCode> {
    let Some(handle) = handle.filter(|h| !h.trim().is_empty()) else {
        return Ok(None);
    };
    if !is_valid_handle(&handle) {
        return Err(StatusCode::BAD_REQUEST);
    }
    Ok(Some(handle))
}

fn resolve_location(
    location: Option<String>,
    citizen_of: &[CountryNumericCode],
) -> Result<String, StatusCode> {
    if let Some(raw) = location {
        let trimmed = raw.trim();
        if !trimmed.is_empty() {
            if !is_valid_location(trimmed) {
                return Err(StatusCode::BAD_REQUEST);
            }
            return Ok(trimmed.to_string());
        }
    }

    let code = citizen_of.first().ok_or(StatusCode::BAD_REQUEST)?;
    country_display_name(code.code())
        .map(|name| name.to_string())
        .ok_or(StatusCode::BAD_REQUEST)
}

#[tracing::instrument(
    skip(app_state, clerk_jwt, payload),
    fields(clerk_sub = %clerk_jwt.sub, citizen_of = ?payload.citizen_of)
)]
async fn register(
    State(app_state): State<AppState>,
    Extension(clerk_jwt): Extension<ClerkJwt>,
    WithRejection(Json(payload), _): WithRejection<Json<RegisterPayload>, ApiError>,
) -> Result<impl IntoResponse, StatusCode> {
    tracing::info!(clerk_sub = %clerk_jwt.sub, citizen_of = ?payload.citizen_of, "POST /register");

    if let Ok(user_id) = app_state.db.user_id_by_clerk_id(&clerk_jwt.sub).await {
        tracing::info!(%user_id, "POST /register: user already exists");
        let user = app_state.db.get_user_by_clerk_id(&clerk_jwt.sub).await;
        return match user {
            Ok(user) => Ok(Json(json!({
                "message": "user already exists",
                "user_id": user.id,
                "user": user_response(user),
            }))),
            Err(err) => {
                tracing::error!(error = %err, "POST /register: existing user row missing");
                Err(StatusCode::INTERNAL_SERVER_ERROR)
            }
        };
    }

    let citizen_of = parse_citizen_of(payload.citizen_of).map_err(|status| {
        tracing::warn!(clerk_sub = %clerk_jwt.sub, "POST /register: invalid citizen_of");
        status
    })?;

    let handle = parse_handle(payload.handle)?;
    let avatar = parse_avatar_key(payload.avatar_key)?;
    let location = resolve_location(payload.location, &citizen_of).map_err(|status| {
        tracing::warn!(clerk_sub = %clerk_jwt.sub, "POST /register: invalid location");
        status
    })?;
    let location = Some(location);

    let create_user = CreateUser {
        validation_type: ValidationType::Clerk,
        citizen_of,
        tag_label: None,
        handle,
        location,
        avatar,
    };

    match app_state
        .db
        .create_user_for_clerk(&clerk_jwt.sub, create_user)
        .await
    {
        Ok(user_id) => {
            tracing::info!(%user_id, "POST /register: user created");
            let user = app_state
                .db
                .get_user_by_clerk_id(&clerk_jwt.sub)
                .await
                .map_err(|err| {
                    tracing::error!(error = %err, "POST /register: created user row missing");
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            Ok(Json(json!({
                "message": "user created",
                "user_id": user_id,
                "user": user_response(user),
            })))
        }
        Err(error) => {
            tracing::error!(error = %error, "POST /register: database error");
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[derive(Serialize)]
struct MeResponse {
    user: Option<UserResponse>,
}

#[tracing::instrument(skip(app_state), fields(clerk_sub = %clerk_jwt.sub))]
async fn me(
    State(app_state): State<AppState>,
    Extension(clerk_jwt): Extension<ClerkJwt>,
) -> Result<Json<MeResponse>, StatusCode> {
    tracing::info!(clerk_sub = %clerk_jwt.sub, "GET /me");

    match app_state.db.get_user_by_clerk_id(&clerk_jwt.sub).await {
        Ok(user) => {
            tracing::info!(
                user_id = %user.id,
                citizen_of = ?user.citizen_of.iter().map(|c| c.code()).collect::<Vec<_>>(),
                "GET /me: platform user found"
            );
            Ok(Json(MeResponse {
                user: Some(user_response(user)),
            }))
        }
        Err(sqlx::Error::RowNotFound) => {
            tracing::info!("GET /me: no platform account yet (client should POST /register)");
            Ok(Json(MeResponse { user: None }))
        }
        Err(err) => {
            tracing::error!(error = %err, "GET /me: database error");
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[tracing::instrument(skip(app_state), fields(clerk_sub = %clerk_jwt.sub))]
async fn delete_account(
    State(app_state): State<AppState>,
    Extension(clerk_jwt): Extension<ClerkJwt>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    tracing::info!(clerk_sub = %clerk_jwt.sub, "DELETE /account");

    match ClerkUsersApi::delete_user(&app_state.clerk, &clerk_jwt.sub).await {
        Ok(_) => {
            tracing::info!(clerk_sub = %clerk_jwt.sub, "DELETE /account: clerk user removed");
        }
        Err(err) => {
            tracing::error!(error = ?err, clerk_sub = %clerk_jwt.sub, "DELETE /account: clerk delete failed");
            return Err(StatusCode::BAD_GATEWAY);
        }
    }

    match app_state.db.delete_user_by_clerk_id(&clerk_jwt.sub).await {
        Ok(()) => {
            tracing::info!(clerk_sub = %clerk_jwt.sub, "DELETE /account: platform user removed");
            Ok(Json(json!({ "message": "account deleted" })))
        }
        Err(err) => {
            tracing::error!(error = %err, clerk_sub = %clerk_jwt.sub, "DELETE /account: database error");
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[tracing::instrument(skip(app_state, multipart), fields(clerk_sub = %clerk_jwt.sub))]
async fn upload_avatar(
    State(app_state): State<AppState>,
    Extension(clerk_jwt): Extension<ClerkJwt>,
    mut multipart: Multipart,
) -> Result<Json<AvatarUploadResponse>, StatusCode> {
    tracing::info!(clerk_sub = %clerk_jwt.sub, "POST /account/avatar");

    let mut file_name: Option<String> = None;
    let mut file_bytes: Option<Vec<u8>> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?
    {
        if field.name() != Some("file") {
            continue;
        }
        file_name = field.file_name().map(str::to_string);
        file_bytes = Some(
            field
                .bytes()
                .await
                .map_err(|_| StatusCode::BAD_REQUEST)?
                .to_vec(),
        );
        break;
    }

    let file_bytes = file_bytes.ok_or(StatusCode::BAD_REQUEST)?;
    let file_name = file_name.unwrap_or_else(|| "upload.jpg".to_string());

    let content_type =
        AvatarStore::content_type_for_filename(&file_name).ok_or(StatusCode::BAD_REQUEST)?;

    let key = app_state
        .avatars
        .put_avatar(file_bytes, content_type)
        .await
        .map_err(|err| {
            tracing::warn!(error = %err, "POST /account/avatar failed");
            match err {
                crate::storage::AvatarStoreError::TooLarge => StatusCode::PAYLOAD_TOO_LARGE,
                crate::storage::AvatarStoreError::UnsupportedType => StatusCode::BAD_REQUEST,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            }
        })?;

    let avatar_url = avatar_public_url(&key);

    Ok(Json(AvatarUploadResponse {
        avatar_key: key.clone(),
        avatar_url,
    }))
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

#[tracing::instrument(skip(app_state), fields(%key))]
async fn serve_avatar(
    State(app_state): State<AppState>,
    Path(key): Path<String>,
) -> Result<Response, StatusCode> {
    validate_avatar_key(&key).map_err(|_| StatusCode::BAD_REQUEST)?;

    let stored = app_state.avatars.get_avatar(&key).await.map_err(|err| {
        tracing::debug!(error = %err, "GET /media/avatars: not found or error");
        StatusCode::NOT_FOUND
    })?;

    Response::builder()
        .status(StatusCode::OK)
        .header(CONTENT_TYPE, stored.content_type)
        .header(CACHE_CONTROL, "public, max-age=86400")
        .body(Body::from(stored.bytes))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

pub fn clerk_from_env() -> Clerk {
    let secret = std::env::var("CLERK_SECRET_KEY").expect("CLERK_SECRET_KEY must be set");
    let config = ClerkConfiguration::new(None, None, Some(secret), None);
    Clerk::new(config)
}
