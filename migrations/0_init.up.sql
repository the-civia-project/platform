-- Created at Sat Mar 28 11:26:57 AM EET 2026
-- Account schema: Clerk-authenticated users.

CREATE SCHEMA IF NOT EXISTS account;

CREATE DOMAIN public.COUNTRY_NUMERIC_CODE AS integer CHECK (
    VALUE IN (
        40, -- Austria (EU)
        56, -- Belgium (EU)
        100, -- Bulgaria (EU)
        191, -- Croatia (EU)
        196, -- Cyprus (EU)
        203, -- Czechia (EU)
        208, -- Denmark (EU)
        233, -- Estonia (EU)
        246, -- Finland (EU)
        250, -- France (EU)
        276, -- Germany (EU)
        300, -- Greece (EU)
        348, -- Hungary (EU)
        372, -- Ireland (EU)
        380, -- Italy (EU)
        428, -- Latvia (EU)
        440, -- Lithuania (EU)
        442, -- Luxembourg (EU)
        470, -- Malta (EU)
        528, -- Netherlands (EU)
        616, -- Poland (EU)
        620, -- Portugal (EU)
        642, -- Romania (EU)
        703, -- Slovakia (EU)
        705, -- Slovenia (EU)
        724, -- Spain (EU)
        752 -- Sweden (EU)
    )
);

CREATE TYPE account.VALIDATION_TYPE AS ENUM ('CLERK');

CREATE TYPE account.ACCOUNT_TAG AS (
    label TEXT,
    discriminator INTEGER
);

CREATE TABLE IF NOT EXISTS account.user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    validation_type account.VALIDATION_TYPE NOT NULL DEFAULT 'CLERK',
    citizen_of public.COUNTRY_NUMERIC_CODE[] NOT NULL CHECK (cardinality(citizen_of) > 0),
    handle VARCHAR(64) UNIQUE CHECK (handle IS NULL OR handle LIKE '@%'),
    tag account.ACCOUNT_TAG NOT NULL UNIQUE,
    name TEXT,
    avatar TEXT,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account.clerk_validation (
    id UUID PRIMARY KEY REFERENCES account.user(id),
    clerk_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account.tag_count (
    label TEXT UNIQUE,
    discriminator INTEGER NOT NULL
);
