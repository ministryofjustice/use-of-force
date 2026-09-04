# Use of Force
[![repo standards badge](https://img.shields.io/badge/dynamic/json?color=blue&style=for-the-badge&logo=github&label=MoJ%20Compliant&query=%24.result&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fuse-of-force)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-github-repositories.html#use-of-force "Link to report")

A DPS service for recording Use of Force incidents in prisons.

Prison staff create a **report** describing an incident. Every other member of staff named on that
report is then asked for their own **statement**. Once all statements are in, the report is complete.
Reviewers and coordinators at the prison oversee the process.

## Architecture at a glance

**This service has no backing API for writes.** Unlike most DPS services, the Express app owns the
Postgres schema outright (via the knex migrations in `migrations/`) and performs all transactional
work itself, in hand-written SQL under `server/data/`. The Kotlin `hmpps-uof-data-api` reads the same
database but is read-only and exists to serve Subject Access Requests.

If you are new to this codebase, start with **[docs/getting-started.md](docs/getting-started.md)**.

## Documentation

Full developer documentation is in **[`docs/`](docs/README.md)**:

| Document | Covers |
| --- | --- |
| [Getting started](docs/getting-started.md) | Running the app and the tests locally, and the traps that cost people a day. |
| [Architecture](docs/architecture.md) | Layers, middleware, authentication, upstream dependencies. |
| [Creating and editing a report](docs/creating-and-editing-a-report.md) | The form journey and the pattern every form change follows. |
| [Data model](docs/data-model.md) | Schema, soft-delete views, transactions, migrations. |
| [Report payload](docs/report-payload.md) | What is inside `report.form_response`, with a worked example. |
| [Process flows](docs/process-flows.md) | Report and statement lifecycles, submission, reminders. |
| [Developer tips](docs/developer-tips.md) | Environment variables, npm scripts, debugging, glossary. |
| [Deployment](docs/deployment.md) | Environments, namespaces, helm, CI/CD. |

### Data dictionary

The schema is published from `main` as a browsable report at
**[ministryofjustice.github.io/use-of-force/schema-spy-report](https://ministryofjustice.github.io/use-of-force/schema-spy-report/)**,
with two CSV exports alongside it for the MOJ Data Catalogue:

| File | Contents |
| --- | --- |
| `data-dictionary.csv` | One row per column: table or view, column, type, nullability, default, description, sensitivity classification, primary key flag, foreign key target. |
| `reference-data.csv` | The permitted values behind every coded column. Every code in this schema is an unconstrained `varchar` or a string inside the `form_response` jsonb — there are no reference tables and no check constraints — so without this a consumer sees a `varchar(20)` with no idea which values are legal. It also decodes `form_response`, which no schema report can describe. |

It is generated from a database built by the knex migrations, so it cannot drift from them. The
descriptions live in the database itself as `COMMENT ON` statements, applied by
[`migrations/20260904000000_schema_comments.js`](migrations/20260904000000_schema_comments.js), so the
report, the CSVs and any Glue crawl all share one source of truth. The Kotlin `hmpps-uof-data-api`
reads this same database, so these descriptions serve that consumer too.

To regenerate it locally — **stop `docker-compose.test.yml` first if it is running, it also binds 5432**:

```bash
npm run schema:report
docker run --rm --network host -v /tmp/schemaspy:/output schemaspy/schemaspy:6.2.4 \
  -t pgsql -host localhost -port 5432 -db use-of-force -s public \
  -u use-of-force -p use-of-force -vizjs
bin/generate-data-dictionary.sh
docker compose -f docker-compose-schema-spy.yml down -v
```

#### Data sensitivity

Every column description ends with a classification tag:

| Tag | Meaning |
| --- | --- |
| `[Sensitivity: NONE]` | Not personal data in itself — keys, timestamps, process flags |
| `[Sensitivity: PERSONAL]` | Personal data about a prisoner — identifies or locates them |
| `[Sensitivity: STAFF]` | Personal data about a member of staff |
| `[Sensitivity: SPECIAL-CATEGORY]` | UK GDPR Article 9 data, or offence data under Article 10 |
| `[Sensitivity: OFFICIAL-SENSITIVE]` | Not personal data, but damaging if disclosed |

`STAFF` is still personal data and still in scope for a staff member's own subject access request. It is
separated from `PERSONAL` so an extract about prisoners can be reasoned about without staff columns
inflating the count.

**The substance of this schema sits in five columns**: `report.form_response`, `statement.statement`,
`statement_amendments.additional_comment`, `report_log.details` and `report_edit.changes`. They hold the
actual account of force used on a named prisoner, including injuries and healthcare given. An extract
that excludes them is a very different risk proposition from one that includes them.

**Any new table, view or column needs a `COMMENT ON`** in a migration — `npm run schema:verify` fails
otherwise. A new coded value needs a description in `db-tooling/exportReferenceData.test.ts`, which
fails rather than exporting a blank row.

## Dependencies

- PostgreSQL, for report and statement data
- Redis, for sessions and the cached system token
- hmpps-auth, prison-api, manage-users-api, prisoner-search-api, locations-inside-prison-api,
  nomis-mapping-api, frontend-components
- GOV.UK Notify, for statement request and reminder emails

## Quick start

Requires Node **22** (see `.nvmrc`), Docker, and `gitleaks` on your PATH for the pre-commit hook.

```bash
nvm use
npm run setup          # NOT npm install - see below
docker compose up -d   # postgres on 5433, redis on 6379
cp .env.example .env
npm run start:dev
```

The app runs on <http://localhost:3000>. Sign in with your `_GEN` development credentials.

- `npm run setup`, not `npm install` — `.npmrc` sets `ignore-scripts = true`, and `setup` runs the
  allowlisted install scripts from `.allowed-scripts.mjs`.
- Development Postgres is published on host port **5433**, but `server/config.ts` defaults `DB_PORT`
  to 5432. `.env.example` sets it correctly.
- Node version currently differs between `.nvmrc` (22), the Dockerfile (22.12) and `package.json`
  `engines`. `.nvmrc` is what CI uses. Because `.npmrc` sets `engine-strict = true`, `npm ci` fails
  outright on a mismatched Node major.

Entry points:

- <http://localhost:3000/> — your reports and statements
- <http://localhost:3000/report/-1/report-use-of-force> — start a report against booking id `-1`

Configuration is read from environment variables; see `.env.example` and `server/config.ts`. Note
that `.env` is only loaded by `npm run start:dev`.

## Tests

```bash
npm run lint
npm run typecheck
npm test
npm run test-coverage
```

Integration tests use Cypress against a wiremock-stubbed environment. Order matters — cypress reads
compiled output from `dist/`:

```bash
docker compose down                              # the two compose stacks both use port 6379
docker compose -f docker-compose.test.yml up -d   # postgres, redis, wiremock
npm run build
npm run start-feature                             # app on port 3007
npm run int-test                                  # or npm run int-test-ui
```

## Contributing

Branch from `main` and raise a PR referencing the JIRA number. CI runs build, unit tests, integration
tests and helm lint on every push; merges to `main` deploy through dev, preprod and prod.
