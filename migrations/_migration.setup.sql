BEGIN;

CREATE SCHEMA IF NOT EXISTS schema_migrations;
CREATE TABLE IF NOT EXISTS schema_migrations.migrations
(
    version       TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON schema_migrations.migrations (applied_at);

COMMIT;