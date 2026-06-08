use crate::db::database::{CountryNumericCode, Database};
use crate::random::handle::{generate_suggested_handle, generate_user_tag_label};
use crate::validation::is_valid_handle;
use serde::{Deserialize, Serialize};
use sqlx::types::time::OffsetDateTime;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "account.validation_type")]
pub enum ValidationType {
    #[sqlx(rename = "CLERK")]
    Clerk,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "account.account_tag")]
pub struct AccountTag {
    pub label: String,
    pub discriminator: i32,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct CreateUser {
    pub validation_type: ValidationType,
    pub citizen_of: Vec<CountryNumericCode>,
    pub tag_label: Option<String>,
    pub handle: Option<String>,
    pub location: Option<String>,
    pub avatar: Option<String>,
}

pub struct User {
    pub id: Uuid,
    pub validation_type: ValidationType,
    pub citizen_of: Vec<CountryNumericCode>,
    pub tag: AccountTag,
    pub handle: Option<String>,
    pub name: Option<String>,
    pub avatar: Option<String>,
    pub location: Option<String>,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

const MAX_HANDLE_ATTEMPTS: u32 = 8;

impl Database {
    pub async fn create_user_for_clerk(
        &self,
        clerk_id: &str,
        user: CreateUser,
    ) -> Result<Uuid, sqlx::Error> {
        let mut handle = user
            .handle
            .clone()
            .unwrap_or_else(generate_suggested_handle);
        if !is_valid_handle(&handle) {
            handle = generate_suggested_handle();
        }

        for attempt in 0..MAX_HANDLE_ATTEMPTS {
            match self
                .create_user_for_clerk_inner(clerk_id, &user, &handle)
                .await
            {
                Ok(id) => return Ok(id),
                Err(sqlx::Error::Database(db_err))
                    if db_err.code() == Some(std::borrow::Cow::Borrowed("23505"))
                        && attempt + 1 < MAX_HANDLE_ATTEMPTS =>
                {
                    handle = generate_suggested_handle();
                }
                Err(e) => return Err(e),
            }
        }

        self.create_user_for_clerk_inner(clerk_id, &user, &handle)
            .await
    }

    async fn create_user_for_clerk_inner(
        &self,
        clerk_id: &str,
        user: &CreateUser,
        handle: &str,
    ) -> Result<Uuid, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let label = user
            .tag_label
            .clone()
            .unwrap_or_else(generate_user_tag_label);

        let discriminator_record = sqlx::query!(
            r#"
                SELECT discriminator
                FROM account.tag_count
                WHERE label = $1
            "#,
            label
        )
        .fetch_one(&mut *tx)
        .await;

        let discriminator = match discriminator_record {
            Ok(discriminator_record) => discriminator_record.discriminator + 1,
            Err(sqlx::Error::RowNotFound) => {
                sqlx::query!(
                    r#"
                        INSERT INTO account.tag_count
                            (label, discriminator)
                        VALUES ($1, $2)
                    "#,
                    label,
                    0
                )
                .execute(&mut *tx)
                .await?;

                1
            }
            Err(e) => return Err(e.into()),
        };

        let created_user = sqlx::query!(
            r#"
                INSERT INTO account."user"
                    (validation_type, citizen_of, handle, tag, avatar, location)
                VALUES
                    ($1, $2, $3, $4, $5, $6)
                RETURNING id
            "#,
            ValidationType::Clerk as ValidationType,
            user.citizen_of.clone() as Vec<CountryNumericCode>,
            handle,
            AccountTag {
                label: label.clone(),
                discriminator
            } as AccountTag,
            user.avatar,
            user.location,
        )
        .fetch_one(&mut *tx)
        .await?;

        sqlx::query!(
            r#"
            INSERT INTO account.clerk_validation (id, clerk_id) VALUES ($1, $2)
            "#,
            created_user.id,
            clerk_id,
        )
        .execute(&mut *tx)
        .await?;

        sqlx::query!(
            r#"
                UPDATE account.tag_count
                SET discriminator = discriminator + 1
                WHERE label = $1
            "#,
            label
        )
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok(created_user.id)
    }

    pub async fn get_user_by_clerk_id(&self, clerk_id: &str) -> Result<User, sqlx::Error> {
        let row = sqlx::query!(
            r#"
            SELECT
                u.id,
                u.validation_type as "validation_type: ValidationType",
                u.citizen_of as "citizenof: Vec<CountryNumericCode>",
                u.handle,
                u.tag as "tag: AccountTag",
                u.name,
                u.avatar,
                u.location,
                u.created_at,
                u.updated_at
            FROM account."user" u
            INNER JOIN account.clerk_validation cv ON cv.id = u.id
            WHERE cv.clerk_id = $1
            "#,
            clerk_id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(User {
            id: row.id,
            validation_type: row.validation_type,
            citizen_of: row.citizenof,
            handle: row.handle,
            tag: row.tag,
            name: row.name,
            avatar: row.avatar,
            location: row.location,
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
    }

    pub async fn user_id_by_clerk_id(&self, clerk_id: &str) -> Result<Uuid, sqlx::Error> {
        sqlx::query!(
            r#"
                SELECT id
                FROM account.clerk_validation
                WHERE clerk_id = $1
            "#,
            clerk_id
        )
        .fetch_one(&self.pool)
        .await
        .map(|row| row.id)
    }

    pub async fn update_user_citizen_of(
        &self,
        user_id: Uuid,
        citizen_of: Vec<CountryNumericCode>,
    ) -> Result<(), sqlx::Error> {
        let result = sqlx::query!(
            r#"
                UPDATE account."user"
                SET citizen_of = $2, updated_at = now()
                WHERE id = $1
            "#,
            user_id,
            citizen_of as Vec<CountryNumericCode>,
        )
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        Ok(())
    }

    pub async fn delete_user_by_clerk_id(&self, clerk_id: &str) -> Result<(), sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let Some(row) = sqlx::query!(
            r#"
                SELECT id
                FROM account.clerk_validation
                WHERE clerk_id = $1
            "#,
            clerk_id
        )
        .fetch_optional(&mut *tx)
        .await?
        else {
            tx.commit().await?;
            return Ok(());
        };

        sqlx::query!(
            r#"
                DELETE FROM account.clerk_validation
                WHERE clerk_id = $1
            "#,
            clerk_id
        )
        .execute(&mut *tx)
        .await?;

        sqlx::query!(
            r#"
                DELETE FROM account."user"
                WHERE id = $1
            "#,
            row.id
        )
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(())
    }
}
