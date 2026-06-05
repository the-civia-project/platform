FROM rust:1-bookworm AS builder

# sqlx `query!` macros need a live Postgres schema during `cargo build`.
#   docker compose up -d pg
#   cd migrations && ./migrate.sh up
#
# Linux:
#   docker build --network=host \
#     --build-arg DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres \
#     -t civia-api .
#
# macOS / Docker Desktop:
#   docker build --add-host=host.docker.internal:host-gateway \
#     --build-arg DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/postgres \
#     -t civia-api .
#
# Fly remote build cannot reach local Postgres — use `fly deploy --local-only`, or add
# `api/.sqlx` + SQLX_OFFLINE (not in this Dockerfile).

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY api ./api
COPY migrations ./migrations
COPY .sqlx ./.sqlx
COPY packages/platform-data ./packages/platform-data

ENV SQLX_OFFLINE=true

RUN cargo build --release -p api

FROM rust:1-bookworm 

COPY --from=builder /app/target/release/api /api
COPY certificates /certificates

EXPOSE 3001
ENTRYPOINT ["/api"]
