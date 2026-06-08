use s3::bucket::Bucket;
use s3::creds::Credentials;
use s3::region::Region;
use std::sync::Arc;
use thiserror::Error;
use uuid::Uuid;

const MAX_AVATAR_BYTES: usize = 5 * 1024 * 1024;

#[derive(Clone)]
pub struct AvatarStore {
    bucket: Arc<Bucket>,
}

#[derive(Debug, Error)]
pub enum AvatarStoreError {
    #[error("avatar storage configuration: {0}")]
    Config(String),
    #[error("avatar storage: {0}")]
    Storage(String),
    #[error("unsupported image type")]
    UnsupportedType,
    #[error("avatar exceeds {MAX_AVATAR_BYTES} bytes")]
    TooLarge,
}

pub struct StoredAvatar {
    pub key: String,
    pub content_type: String,
    pub bytes: Vec<u8>,
}

fn require_env(name: &str) -> Result<String, AvatarStoreError> {
    let value =
        std::env::var(name).map_err(|_| AvatarStoreError::Config(format!("{name} must be set")))?;
    let value = value.trim().to_owned();
    if value.is_empty() {
        return Err(AvatarStoreError::Config(format!("{name} must be set")));
    }
    Ok(value)
}

/// Long-lived credentials for an object-storage user (access key + secret key).
struct S3UserCredentials {
    access_key: String,
    secret_key: String,
}

impl S3UserCredentials {
    fn from_env() -> Result<Self, AvatarStoreError> {
        Ok(Self {
            access_key: require_env("S3_ACCESS_KEY")?,
            secret_key: require_env("S3_SECRET_KEY")?,
        })
    }
}

impl AvatarStore {
    pub async fn from_env() -> Result<Self, AvatarStoreError> {
        let endpoint = require_env("S3_ENDPOINT")?;
        let _iam_endpoint = require_env("S3_IAM_ENDPOINT")?;
        let _sts_endpoint = require_env("S3_STS_ENDPOINT")?;
        let user = S3UserCredentials::from_env()?;
        let bucket_name = std::env::var("S3_AVATAR_BUCKET")
            .unwrap_or_else(|_| "avatars".into())
            .trim()
            .to_owned();
        if bucket_name.is_empty() {
            return Err(AvatarStoreError::Config(
                "S3_AVATAR_BUCKET must be set".into(),
            ));
        }

        let region = Region::Custom {
            region: "us-east-1".to_owned(),
            endpoint,
        };
        let credentials = Credentials::new(
            Some(&user.access_key),
            Some(&user.secret_key),
            None,
            None,
            None,
        )
        .map_err(|e| AvatarStoreError::Config(e.to_string()))?;

        let bucket = Bucket::new(&bucket_name, region, credentials)
            .map_err(|e| AvatarStoreError::Config(e.to_string()))?
            .with_path_style();

        match bucket.exists().await {
            Ok(true) => tracing::debug!(%bucket_name, "avatar bucket exists"),
            Ok(false) => {
                tracing::warn!(
                    %bucket_name,
                    "avatar bucket missing — create it in object storage (e.g. mc mb local/avatars)"
                );
            }
            Err(err) => {
                tracing::warn!(%bucket_name, error = %err, "could not check avatar bucket");
            }
        }

        Ok(Self {
            bucket: Arc::from(bucket),
        })
    }

    pub fn content_type_for_filename(filename: &str) -> Option<&'static str> {
        let lower = filename.to_ascii_lowercase();
        if lower.ends_with(".jpg") || lower.ends_with(".jpeg") {
            Some("image/jpeg")
        } else if lower.ends_with(".png") {
            Some("image/png")
        } else if lower.ends_with(".webp") {
            Some("image/webp")
        } else {
            None
        }
    }

    pub fn extension_for_content_type(content_type: &str) -> Option<&'static str> {
        match content_type {
            "image/jpeg" => Some("jpg"),
            "image/png" => Some("png"),
            "image/webp" => Some("webp"),
            _ => None,
        }
    }

    pub async fn put_avatar(
        &self,
        bytes: Vec<u8>,
        content_type: &str,
    ) -> Result<String, AvatarStoreError> {
        if bytes.len() > MAX_AVATAR_BYTES {
            return Err(AvatarStoreError::TooLarge);
        }
        let ext = Self::extension_for_content_type(content_type)
            .ok_or(AvatarStoreError::UnsupportedType)?;
        let key = format!("avatars/{}.{}", Uuid::new_v4(), ext);

        self.bucket
            .put_object_with_content_type(&key, &bytes, content_type)
            .await
            .map_err(|e| AvatarStoreError::Storage(e.to_string()))?;

        Ok(key)
    }

    pub async fn get_avatar(&self, key: &str) -> Result<StoredAvatar, AvatarStoreError> {
        validate_avatar_key(key)?;

        let response = self
            .bucket
            .get_object(key)
            .await
            .map_err(|e| AvatarStoreError::Storage(e.to_string()))?;

        let content_type = mime_guess::from_path(key)
            .first_or_octet_stream()
            .to_string();

        Ok(StoredAvatar {
            key: key.to_string(),
            content_type,
            bytes: response.bytes().to_vec(),
        })
    }
}

pub fn validate_avatar_key(key: &str) -> Result<(), AvatarStoreError> {
    if !key.starts_with("avatars/") {
        return Err(AvatarStoreError::Storage(
            "invalid avatar key prefix".into(),
        ));
    }
    if key.contains("..") || key.contains('\\') {
        return Err(AvatarStoreError::Storage("invalid avatar key".into()));
    }
    if !key
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '/' || c == '.' || c == '_' || c == '-')
    {
        return Err(AvatarStoreError::Storage(
            "invalid avatar key charset".into(),
        ));
    }
    Ok(())
}

pub fn avatar_public_url(key: &str) -> String {
    let base = std::env::var("PLATFORM_API_URL")
        .unwrap_or_else(|_| "http://platform.localhost:3001".into());
    let base = base.trim_end_matches('/');
    format!("{base}/media/avatars/{key}")
}
