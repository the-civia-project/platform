#!/bin/bash

COMMAND=$1  # up, down, or new


if [[ "$COMMAND" == "up" || "$COMMAND" == "down" ]]; then
  DB_URL="postgres://postgres:postgres@localhost:5432"

  # Making sure the schema_migrations.migrations table exists
  psql "$DB_URL" -q \
    -v ON_ERROR_STOP=1 -v client_min_messages=error \
    -f ./_migration.setup.sql > /dev/null 2>&1
fi

if [[ "$COMMAND" == "up" ]]; then
  for file in $(printf '%s\n' *.up.sql | sort -V); do
    version="${file%.up.sql}"

    applied=$(psql "$DB_URL" -tAc \
      "SELECT 1 FROM schema_migrations.migrations WHERE version = '$version'")

    if [[ "$applied" == "1" ]]; then
      echo "Skipping $version (already applied)"
      continue
    fi
    echo "Running $version"

    if ! psql "$DB_URL" -q -v ON_ERROR_STOP=1 <<SQL
      BEGIN;
        -- the migration
        $(cat ./"$file");

        -- the migration record
        INSERT INTO schema_migrations.migrations (version) VALUES ('$version');
      COMMIT;
SQL
  then
    echo "❌ Migration failed: $file" >&2
    exit 1
  fi
  done
elif [[ "$COMMAND" == "down" ]]; then
  for file in $(printf '%s\n' *.down.sql | sort -Vr); do
    version="${file%.down.sql}"

    applied=$(psql "$DB_URL" -tAc \
      "SELECT 1 FROM schema_migrations.migrations WHERE version = '$version'")

    if [ ! "$applied" ]; then
      echo "Skipping $version (not applied)"
      continue
    fi

    echo "Running $version"

    if ! psql "$DB_URL" -q -v ON_ERROR_STOP=1 <<SQL
      BEGIN;
        -- the migration
        $(cat ./"$file");

        -- the migration record
        DELETE FROM schema_migrations.migrations WHERE version = '$version';
      COMMIT;
SQL
    then
      echo "❌ Migration failed: $file" >&2
      exit 1
   fi
  done
elif [[ "$COMMAND" == "new" ]]; then
  if [[ -n "${2:-}" ]]; then
    name="$2"
  else
    echo "Usage: $0 new [migration_name]"
    exit 1
  fi

  now=$(date +%s)
  migration_file="${now}_${name}"

  up="${migration_file}.up.sql"
  down="${migration_file}.down.sql"

  header="-- Created at $(date)";

  echo "$header" > "$up";
  echo "Created $up";

  echo "$header" > "$down";
  echo "Created $down";
else
  echo "Usage: $0 up|down|new"
  exit 1
fi