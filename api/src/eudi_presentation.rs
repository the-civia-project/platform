//! German EUDI Wallet OpenID4VP / HAIP PID presentation (JAR, session store, wallet callbacks).

use std::collections::HashMap;
use std::fs;
use std::sync::RwLock;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use axum::body::Bytes;
use axum::http::header::{CACHE_CONTROL, CONTENT_TYPE, PRAGMA};
use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use base64::Engine;
use base64::engine::general_purpose::{STANDARD as B64_STD, URL_SAFE_NO_PAD as B64_URL};
use jsonwebtoken::{Algorithm, EncodingKey, Header, encode};
use p256::SecretKey;
use p256::ecdsa::SigningKey;
use p256::elliptic_curve::rand_core::OsRng;
use p256::elliptic_curve::sec1::ToEncodedPoint;
use p256::pkcs8::EncodePrivateKey;
use serde::Serialize;
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use thiserror::Error;
use uuid::Uuid;

const HAIP_AUDIENCE: &str = "https://self-issued.me/v2";
const REQUEST_TTL_SECS: u64 = 600;
/// RFC 9101 / OpenID4VP media type for a dereferenced `request_uri` (GET).
const JAR_CONTENT_TYPE: &str = "application/oauth-authz-req+jwt";

#[derive(Debug, Error)]
pub enum EudiPresentationError {
    #[error("EUDI presentation misconfigured: {0}")]
    Config(String),
    #[error("session not found")]
    SessionNotFound,
    #[error("presentation session expired")]
    SessionExpired,
    #[error("invalid wallet response: {0}")]
    InvalidResponse(String),
    #[error("presentation signing failed: {0}")]
    Signing(String),
    #[error("internal error: {0}")]
    Internal(String),
}

#[derive(Clone)]
pub struct EudiPresentationService {
    public_base_url: String,
    client_id: String,
    signing_key: EncodingKey,
    x5c_der: Vec<u8>,
    registration_certificate: Option<String>,
    sessions: std::sync::Arc<RwLock<HashMap<Uuid, PresentationSession>>>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PresentationStatus {
    Pending,
    ResponseReceived,
    Verified,
    Failed,
}

#[derive(Clone)]
struct PresentationSession {
    nonce: String,
    created_at_unix: u64,
    response_decryption_pem: String,
    status: PresentationStatus,
    encrypted_response: Option<String>,
    failure_reason: Option<String>,
}

pub struct PresentationCompleteView {
    pub session_id: Uuid,
    pub status: PresentationStatus,
    pub failure_reason: Option<String>,
}

impl EudiPresentationService {
    pub fn from_env() -> Result<Self, EudiPresentationError> {
        let public_base_url = std::env::var("EUDI_VERIFIER_PUBLIC_URL")
            .or_else(|_| std::env::var("EXPO_PUBLIC_EUDI_VERIFIER_URL"))
            .unwrap_or_else(|_| "http://platform.localhost:3001".into())
            .trim_end_matches('/')
            .to_string();

        let (signing_key, x5c_der, client_id) = load_signing_material()?;
        let registration_certificate = load_registration_certificate()?;

        Ok(Self {
            public_base_url,
            client_id,
            signing_key,
            x5c_der,
            registration_certificate,
            sessions: std::sync::Arc::new(RwLock::new(HashMap::new())),
        })
    }

    pub fn client_id(&self) -> &str {
        &self.client_id
    }

    pub fn request_uri_for_session(&self, session_id: Uuid) -> String {
        format!(
            "{}/wallet/presentation/start/{}",
            self.public_base_url, session_id
        )
    }

    pub fn response_uri_for_session(&self, session_id: Uuid) -> String {
        format!(
            "{}/wallet/presentation/response/{}",
            self.public_base_url, session_id
        )
    }

    pub fn complete_uri_for_session(&self, session_id: Uuid) -> String {
        format!(
            "{}/wallet/presentation/complete/{}",
            self.public_base_url, session_id
        )
    }

    /// Build and sign a HAIP PID presentation JAR for `GET /wallet/presentation/start/{session_id}`.
    pub fn issue_jar(&self, session_id: Uuid) -> Result<String, EudiPresentationError> {
        let now = unix_now();
        let nonce = Uuid::new_v4().to_string();
        let (response_jwk, response_decryption_pem) = generate_ephemeral_response_key()?;

        {
            let mut sessions = self
                .sessions
                .write()
                .map_err(|e| EudiPresentationError::Internal(e.to_string()))?;
            sessions.insert(
                session_id,
                PresentationSession {
                    nonce: nonce.clone(),
                    created_at_unix: now,
                    response_decryption_pem,
                    status: PresentationStatus::Pending,
                    encrypted_response: None,
                    failure_reason: None,
                },
            );
        }

        let mut claims = pid_presentation_claims(
            &self.client_id,
            &self.response_uri_for_session(session_id),
            &nonce,
            session_id,
            now,
            &response_jwk,
        );

        // if let Some(registration_certificate) = &self.registration_certificate {
        //     claims["verifier_info"] = json!({
        //         "format": "registration_cert",
        //         "data": registration_certificate
        //     });
        // }

        let jar = sign_jar(&claims, &self.signing_key, &self.x5c_der)
            .map_err(|e| EudiPresentationError::Signing(e.to_string()))?;

        tracing::info!(
            %session_id,
            client_id = %self.client_id,
            "issued EUDI presentation JAR"
        );

        Ok(jar)
    }

    pub fn jar_http_response(&self, session_id: Uuid) -> Result<Response, EudiPresentationError> {
        let jar = self.issue_jar(session_id)?;

        Ok(Response::builder()
            .status(StatusCode::OK)
            .header(CONTENT_TYPE, HeaderValue::from_static(JAR_CONTENT_TYPE))
            .header(CACHE_CONTROL, HeaderValue::from_static("no-store"))
            .header(PRAGMA, HeaderValue::from_static("no-cache"))
            .body(axum::body::Body::from(jar))
            .map_err(|e| EudiPresentationError::Internal(e.to_string()))?)
    }

    /// Wallet `POST` to `response_uri` after consent (`direct_post.jwt`).
    pub fn accept_wallet_response(
        &self,
        session_id: Uuid,
        headers: &HeaderMap,
        body: &Bytes,
    ) -> Result<(), EudiPresentationError> {
        let content_type = headers
            .get(CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");

        if !content_type.starts_with("application/x-www-form-urlencoded") {
            return Err(EudiPresentationError::InvalidResponse(format!(
                "expected application/x-www-form-urlencoded, got {content_type}"
            )));
        }

        let form = parse_form_urlencoded(body);
        let encrypted = form
            .get("response")
            .ok_or_else(|| EudiPresentationError::InvalidResponse("missing response".into()))?;

        if encrypted.len() > 1_000_000 {
            return Err(EudiPresentationError::InvalidResponse(
                "payload too large".into(),
            ));
        }

        let mut sessions = self
            .sessions
            .write()
            .map_err(|e| EudiPresentationError::Internal(e.to_string()))?;
        let session = sessions
            .get_mut(&session_id)
            .ok_or(EudiPresentationError::SessionNotFound)?;

        if unix_now().saturating_sub(session.created_at_unix) > REQUEST_TTL_SECS {
            session.status = PresentationStatus::Failed;
            session.failure_reason = Some("session expired".into());
            return Err(EudiPresentationError::SessionExpired);
        }

        session.encrypted_response = Some(encrypted.clone());
        session.status = PresentationStatus::ResponseReceived;

        // Full JWE decrypt + Chapter 4 validation is follow-up work; wallet flow can proceed.
        tracing::info!(
            %session_id,
            response_len = encrypted.len(),
            "wallet posted encrypted presentation response"
        );

        Ok(())
    }

    pub fn complete_view(
        &self,
        session_id: Uuid,
    ) -> Result<PresentationCompleteView, EudiPresentationError> {
        let sessions = self
            .sessions
            .read()
            .map_err(|e| EudiPresentationError::Internal(e.to_string()))?;
        let session = sessions
            .get(&session_id)
            .ok_or(EudiPresentationError::SessionNotFound)?;

        if unix_now().saturating_sub(session.created_at_unix) > REQUEST_TTL_SECS {
            return Err(EudiPresentationError::SessionExpired);
        }

        Ok(PresentationCompleteView {
            session_id,
            status: session.status.clone(),
            failure_reason: session.failure_reason.clone(),
        })
    }

    #[cfg(test)]
    fn new_dev() -> Self {
        let (signing_key, x5c_der, client_id) =
            generate_dev_signing_material().expect("dev signing");
        Self {
            public_base_url: "https://platform.test".into(),
            client_id,
            signing_key,
            x5c_der,
            registration_certificate: None,
            sessions: std::sync::Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

fn pid_presentation_claims(
    client_id: &str,
    response_uri: &str,
    nonce: &str,
    session_id: Uuid,
    now: u64,
    response_jwk: &Value,
) -> Value {
    json!({
        "response_type": "vp_token",
        "client_id": client_id,
        "response_uri": response_uri,
        "response_mode": "direct_post.jwt",
        "nonce": nonce,
        "state": session_id.to_string(),
        "aud": HAIP_AUDIENCE,
        "iat": now,
        "exp": now + REQUEST_TTL_SECS,
        "dcql_query": {
            "credentials": [
                {
                    "id": "pid-sd-jwt",
                    "format": "dc+sd-jwt",
                    "claims": [
                        { "path": ["nationalities"] }
                    ],
                    "meta": {
                        "vct_values": ["urn:eudi:pid:de:1"]
                    }
                },
                {
                    "id": "pid-mso-mdoc",
                    "format": "mso_mdoc",
                    "claims": [
                        { "path": ["eu.europa.ec.eudi.pid.1", "nationality"] }
                    ],
                    "meta": {
                        "doctype_value": "eu.europa.ec.eudi.pid.1"
                    }
                }
            ],
            "credential_sets": [
                {
                    "options": [
                        ["pid-sd-jwt"],
                        ["pid-mso-mdoc"]
                    ]
                }
            ]
        },
        "client_metadata": {
            "jwks": {
                "keys": [response_jwk]
            },
            "vp_formats_supported": {
                "mso_mdoc": { "alg": ["ES256"] },
                "dc+sd-jwt": {
                    "kb-jwt_alg_values": ["ES256"],
                    "sd-jwt_alg_values": ["ES256"]
                }
            },
            "encrypted_response_enc_values_supported": ["A128GCM", "A256GCM"]
        }
    })
}

fn sign_jar(
    claims: &Value,
    signing_key: &EncodingKey,
    cert_der: &[u8],
) -> Result<String, jsonwebtoken::errors::Error> {
    let mut header = Header::new(Algorithm::ES256);
    header.typ = Some("oauth-authz-req+jwt".into());
    header.x5c = Some(vec![B64_STD.encode(cert_der)]);
    encode(&header, claims, signing_key)
}

fn generate_ephemeral_response_key() -> Result<(Value, String), EudiPresentationError> {
    let secret = SecretKey::random(&mut OsRng);
    let pem = secret
        .to_pkcs8_pem(p256::pkcs8::LineEnding::LF)
        .map_err(|e| EudiPresentationError::Signing(e.to_string()))?
        .to_string();
    let point = secret.public_key().to_encoded_point(false);
    let x =
        B64_URL.encode(point.x().ok_or_else(|| {
            EudiPresentationError::Signing("ephemeral public key missing x".into())
        })?);
    let y =
        B64_URL.encode(point.y().ok_or_else(|| {
            EudiPresentationError::Signing("ephemeral public key missing y".into())
        })?);
    let kid = Uuid::new_v4().to_string();
    let jwk = json!({
        "kty": "EC",
        "crv": "P-256",
        "x": x,
        "y": y,
        "alg": "ECDH-ES",
        "kid": kid
    });
    Ok((jwk, pem))
}

fn load_signing_material() -> Result<(EncodingKey, Vec<u8>, String), EudiPresentationError> {
    if std::env::var("EUDI_DEV_INSECURE_SIGNING")
        .ok()
        .filter(|v| v == "1")
        .is_some()
    {
        tracing::warn!("EUDI_DEV_INSECURE_SIGNING=1 — using ephemeral access cert (sandbox only)");
        return Ok(generate_dev_signing_material()?);
    }

    let cert_path = std::env::var("EUDI_ACCESS_CERT_PATH")
        .map_err(|_| EudiPresentationError::Config("EUDI_ACCESS_CERT_PATH not set".into()))?;
    let key_path = std::env::var("EUDI_ACCESS_CERT_KEY_PATH")
        .map_err(|_| EudiPresentationError::Config("EUDI_ACCESS_CERT_KEY_PATH not set".into()))?;

    let cert_pem = fs::read_to_string(&cert_path)
        .map_err(|e| EudiPresentationError::Config(format!("read {cert_path}: {e}")))?;
    let key_pem = fs::read_to_string(&key_path)
        .map_err(|e| EudiPresentationError::Config(format!("read {key_path}: {e}")))?;

    let cert_der = pem_first_block_der(&cert_pem, "CERTIFICATE")?;
    let client_id = client_id_from_env_or_cert(&cert_der)?;
    let signing_key = EncodingKey::from_ec_pem(key_pem.as_bytes())
        .map_err(|e| EudiPresentationError::Config(format!("EC private key: {e}")))?;

    Ok((signing_key, cert_der, client_id))
}

fn load_registration_certificate() -> Result<Option<String>, EudiPresentationError> {
    let path = match std::env::var("EUDI_REGISTRATION_CERT_PATH") {
        Ok(path) => path,
        Err(_) => return Ok(None),
    };
    let contents = fs::read_to_string(&path)
        .map_err(|e| EudiPresentationError::Config(format!("read {path}: {e}")))?;
    let trimmed = contents.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }
    Ok(Some(trimmed.to_string()))
}

fn client_id_from_env_or_cert(cert_der: &[u8]) -> Result<String, EudiPresentationError> {
    if let Ok(raw) = std::env::var("EUDI_X509_HASH_CLIENT_ID") {
        let trimmed = raw.trim();
        if trimmed.is_empty() {
            return Err(EudiPresentationError::Config(
                "EUDI_X509_HASH_CLIENT_ID is empty".into(),
            ));
        }
        if trimmed.starts_with("x509_hash:") {
            return Ok(trimmed.to_string());
        }
        return Ok(format!("x509_hash:{trimmed}"));
    }
    Ok(format!("x509_hash:{}", x509_hash_base64url(cert_der)))
}

fn x509_hash_base64url(cert_der: &[u8]) -> String {
    B64_URL.encode(Sha256::digest(cert_der))
}

fn generate_dev_signing_material() -> Result<(EncodingKey, Vec<u8>, String), EudiPresentationError>
{
    let signing = SigningKey::random(&mut OsRng);
    let secret = SecretKey::from(&signing);
    let pem = secret
        .to_pkcs8_pem(p256::pkcs8::LineEnding::LF)
        .map_err(|e| EudiPresentationError::Signing(e.to_string()))?
        .to_string();
    let cert_der = signing
        .verifying_key()
        .to_encoded_point(false)
        .as_bytes()
        .to_vec();
    let client_id = format!("x509_hash:{}", x509_hash_base64url(&cert_der));
    let signing_key = EncodingKey::from_ec_pem(pem.as_bytes())
        .map_err(|e| EudiPresentationError::Signing(e.to_string()))?;
    Ok((signing_key, cert_der, client_id))
}

fn pem_first_block_der(pem: &str, label: &str) -> Result<Vec<u8>, EudiPresentationError> {
    let mut reader = pem.as_bytes();
    for item in rustls_pemfile::read_all(&mut reader) {
        let item = item.map_err(|e| EudiPresentationError::Config(format!("parse PEM: {e}")))?;
        if let rustls_pemfile::Item::X509Certificate(der) = item {
            return Ok(der.to_vec());
        }
    }
    Err(EudiPresentationError::Config(format!(
        "no {label} block in PEM"
    )))
}

fn parse_form_urlencoded(body: &Bytes) -> HashMap<String, String> {
    let mut map = HashMap::new();
    let text = String::from_utf8_lossy(body);
    for pair in text.split('&') {
        let Some((key, value)) = pair.split_once('=') else {
            continue;
        };
        map.insert(urlencoding_decode(key), urlencoding_decode(value));
    }
    map
}

fn urlencoding_decode(input: &str) -> String {
    let mut out = String::new();
    let bytes = input.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            let hex = &input[i + 1..i + 3];
            if let Ok(byte) = u8::from_str_radix(hex, 16) {
                out.push(byte as char);
                i += 3;
                continue;
            }
        }
        if bytes[i] == b'+' {
            out.push(' ');
        } else {
            out.push(bytes[i] as char);
        }
        i += 1;
    }
    out
}

fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::ZERO)
        .as_secs()
}

impl IntoResponse for EudiPresentationError {
    fn into_response(self) -> Response {
        let status = match &self {
            EudiPresentationError::SessionNotFound => StatusCode::NOT_FOUND,
            EudiPresentationError::SessionExpired => StatusCode::GONE,
            EudiPresentationError::InvalidResponse(_) => StatusCode::BAD_REQUEST,
            EudiPresentationError::Config(_) | EudiPresentationError::Signing(_) => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
            EudiPresentationError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        let message = self.to_string();
        tracing::warn!(%message, "EUDI presentation error");
        (status, axum::Json(json!({ "message": message }))).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_service() -> EudiPresentationService {
        EudiPresentationService::new_dev()
    }

    #[tokio::test]
    async fn jar_http_response_is_raw_jwt_not_json_string() {
        let service = test_service();
        let session_id = Uuid::new_v4();
        let response = service
            .jar_http_response(session_id)
            .expect("http response");

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response
                .headers()
                .get(CONTENT_TYPE)
                .and_then(|v| v.to_str().ok()),
            Some(JAR_CONTENT_TYPE)
        );

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("body bytes");
        let body = std::str::from_utf8(&body).expect("utf8");
        assert!(
            !body.starts_with('"'),
            "wallet expects raw compact JWT, not a JSON-encoded string"
        );
        assert_eq!(body.split('.').count(), 3);
    }

    #[test]
    fn jar_is_compact_jwt_with_haip_claims() {
        let service = test_service();
        let session_id = Uuid::new_v4();
        let jar = service.issue_jar(session_id).expect("jar");
        let parts: Vec<_> = jar.split('.').collect();
        assert_eq!(parts.len(), 3);

        let payload_bytes = B64_URL.decode(parts[1]).expect("payload b64");
        let payload: Value = serde_json::from_slice(&payload_bytes).expect("json");

        assert_eq!(payload["response_type"], "vp_token");
        assert_eq!(payload["response_mode"], "direct_post.jwt");
        assert_eq!(payload["state"], session_id.to_string());
        assert_eq!(payload["aud"], HAIP_AUDIENCE);
        assert!(
            payload["client_id"]
                .as_str()
                .unwrap_or("")
                .starts_with("x509_hash:")
        );
        assert!(payload["dcql_query"]["credentials"].is_array());
    }

    #[test]
    fn wallet_response_stores_encrypted_payload() {
        let service = test_service();
        let session_id = Uuid::new_v4();
        service.issue_jar(session_id).expect("jar");

        let body = Bytes::from("response=eyJ.test");
        let mut headers = HeaderMap::new();
        headers.insert(
            CONTENT_TYPE,
            HeaderValue::from_static("application/x-www-form-urlencoded"),
        );

        service
            .accept_wallet_response(session_id, &headers, &body)
            .expect("accept response");

        let view = service.complete_view(session_id).expect("complete view");
        assert_eq!(view.status, PresentationStatus::ResponseReceived);
    }
}
