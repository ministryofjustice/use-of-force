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
