#!/usr/bin/env bash
#
# Exports the CSIP schema as a flat CSV data dictionary.
#
# The descriptions come from the COMMENT ON statements in migration/common/V60__schema_comments.sql
# and V65__schema_comments_sensitivity.sql, so this is the same source of truth as the SchemaSpy
# report. The sensitivity classification is pulled out of the trailing [Sensitivity: X] tag into its
# own column, so a consumer can filter on it rather than parse prose. The output is intended for the
# MOJ Data Catalogue / AWS Glue.
#
# Usage:
#   scripts/generate-data-dictionary.sh [output-file]
#
# Expects a database built by Flyway. Connection details are taken from the environment, defaulting
# to the container in docker-compose-schema-spy.yml:
# Stop docker-compose.test.yml first if it is running - it also binds 5432.
#   DB_HOST (localhost) DB_PORT (5432) DB_NAME (use-of-force) DB_USER (use-of-force)
#   DB_PASSWORD (use-of-force) DB_SCHEMA (public)

set -euo pipefail

OUTPUT="${1:-data-dictionary.csv}"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-use-of-force}"
DB_USER="${DB_USER:-use-of-force}"
DB_PASSWORD="${DB_PASSWORD:-use-of-force}"
DB_SCHEMA="${DB_SCHEMA:-public}"

export PGPASSWORD="$DB_PASSWORD"

# relkind 'v' is included alongside 'r' because v_report, v_statement and v_statement_amendments are the
# path the application actually reads and writes through - anyone scoping a SAR or an ingestion needs to
# see their columns, not just the base tables.
read -r -d '' QUERY <<SQL || true
SELECT
  c.relname                                              AS table_name,
  CASE c.relkind WHEN 'v' THEN 'VIEW' ELSE 'TABLE' END   AS object_type,
  obj_description(c.oid, 'pg_class')                                 AS table_description,
  a.attname                                              AS column_name,
  a.attnum                                               AS ordinal_position,
  format_type(a.atttypid, a.atttypmod)                   AS data_type,
  NOT a.attnotnull                                       AS is_nullable,
  pg_get_expr(ad.adbin, ad.adrelid)                      AS column_default,
  regexp_replace(
    col_description(c.oid, a.attnum),
    '\s*\[Sensitivity: [A-Z-]+\]\$', ''
  )                                                      AS column_description,
  substring(
    col_description(c.oid, a.attnum)
    from '\[Sensitivity: ([A-Z-]+)\]'
  )                                                      AS sensitivity,
  CASE WHEN pk.column_name IS NOT NULL THEN 'Y' ELSE 'N' END AS is_primary_key,
  fk.references_table                                    AS foreign_key_references
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
-- Constraints are read from pg_catalog rather than information_schema. Constraint names are unique
-- per table in Postgres, not per schema, and information_schema.key_column_usage joins only on
-- constraint_name and schema - so two tables with a same-named constraint fan out and duplicate every
-- column of both. It bit the incentives API for real (see IR-1879), where the CSV silently gained six
-- phantom rows. pg_constraint carries the owning relation, so it cannot.
LEFT JOIN (
  SELECT rel.relname AS table_name, att.attname AS column_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN unnest(con.conkey) AS k(attnum) ON TRUE
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
  WHERE con.contype = 'p'
    AND con.connamespace = '${DB_SCHEMA}'::regnamespace
  GROUP BY rel.relname, att.attname
) pk ON pk.table_name = c.relname AND pk.column_name = a.attname
LEFT JOIN (
  SELECT rel.relname AS table_name, att.attname AS column_name,
         string_agg(DISTINCT ref.relname, '; ') AS references_table
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_class ref ON ref.oid = con.confrelid
  JOIN unnest(con.conkey) AS k(attnum) ON TRUE
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
  WHERE con.contype = 'f'
    AND con.connamespace = '${DB_SCHEMA}'::regnamespace
  GROUP BY rel.relname, att.attname
) fk ON fk.table_name = c.relname AND fk.column_name = a.attname
WHERE n.nspname = '${DB_SCHEMA}'
  AND c.relkind IN ('r', 'v')
  AND c.relname NOT IN ('knex_migrations', 'knex_migrations_lock', 'flyway_schema_history')
ORDER BY c.relname, a.attnum
SQL

COPY_COMMAND="COPY ($QUERY) TO STDOUT WITH (FORMAT csv, HEADER true)"

if command -v psql > /dev/null 2>&1; then
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 -c "$COPY_COMMAND" > "$OUTPUT"
else
  # No local client - use the postgres image. host.docker.internal resolves on Docker Desktop,
  # and --add-host makes it resolve on Linux too.
  docker run --rm --add-host=host.docker.internal:host-gateway \
    -e PGPASSWORD="$DB_PASSWORD" postgres:16.4 \
    psql -h "$([ "$DB_HOST" = "localhost" ] && echo host.docker.internal || echo "$DB_HOST")" \
    -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 -c "$COPY_COMMAND" > "$OUTPUT"
fi

echo "Wrote $(($(wc -l < "$OUTPUT") - 1)) columns to $OUTPUT"
