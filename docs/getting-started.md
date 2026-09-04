# Getting started

For a developer who knows HMPPS (hmpps-auth, Cloud Platform, helm, DPS) but has not worked on Use of
Force before. Every command here is meant to work as written — if one doesn't, fix the doc.

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node | **22** (`.nvmrc`) | `nvm use` in the repo root. See the warning below. |
| npm | 11 | Ships with recent Node 22. |
| Docker | any current version | For Postgres, Redis and (for integration tests) wiremock. |
| gitleaks | any | `brew install gitleaks`. **Not** an npm dependency — the pre-commit hook fails without it. |

> **Node version drift.** Four files disagree: `README.md` has historically said one thing, `.nvmrc`
> says `22`, the `Dockerfile` pins `node:22.12-bookworm-slim`, and `package.json` `engines` says
> something else again. Because `.npmrc` sets `engine-strict = true`, `npm ci` **hard-fails** rather
> than warning when your Node major doesn't satisfy `engines`. CI uses `.nvmrc`, so `.nvmrc` is the
> version to match. Renovate cannot self-correct this — its config disables `engines` and Docker
> `node` major updates. Reconciling the four is a known outstanding task.

## Install

```bash
nvm use
npm run setup
```

**Use `npm run setup`, not `npm install`.** `.npmrc` sets `ignore-scripts = true`, so package install
scripts are blocked by default. `npm run setup` runs `npm ci` and then
`hmpps-npm-script-run-allowlist`, which executes install scripts only for the packages listed in
`.allowed-scripts.mjs` (cypress, dtrace-provider, @parcel/watcher, fsevents, unrs-resolver,
applicationinsights-native-metrics). Plain `npm install` skips that step and leaves cypress without
its binary.

> Those allowlist entries are **exact version pins**. When Renovate bumps one of those packages,
> `.allowed-scripts.mjs` must be updated in the same PR or `npm run setup` breaks.

## Run it

```bash
docker compose up -d      # postgres on 5433, redis on 6379
cp .env.example .env      # optional but recommended - see below
npm run start:dev
```

The app is on <http://localhost:3000>. `start:dev` builds once and then runs four watchers
concurrently: TypeScript, Sass, the Nunjucks views (copied into `dist/`), and nodemon on `dist/`.

Sign in with your **`_GEN` development credentials**.

Useful entry points:

- <http://localhost:3000/> — your reports and statements
- <http://localhost:3000/report/-1/report-use-of-force> — start a report against booking id `-1`
- <http://localhost:3000/health> — health of the app and its upstream dependencies

### The database port trap

Read this one twice; it catches nearly everyone.

| Context | Postgres host port | Database |
| --- | --- | --- |
| `docker-compose.yml` (development) | **5433** | `use-of-force` |
| `docker-compose.test.yml` (integration tests) | **5432** | `use-of-force-int` |
| `server/config.ts` default for `DB_PORT` | **5432** | `use-of-force` |

Only the `watch-node` and `send-reminders` npm scripts inject `DB_PORT=5433`. So `npm run start:dev`
finds the dev database, but running `node dist/server.js` by hand does not — it silently connects to
5432, which is either nothing or your integration-test database. Setting `DB_PORT=5433` in `.env`
(as `.env.example` does) avoids this for `start:dev`.

### Migrations

Migrations are knex files in `migrations/` and they run **automatically at application boot** —
`server.ts` calls `knex.migrate.latest()` and only then `app.listen()`. There is nothing to run by
hand for a normal local setup.

> **`npm run migrate` does not work.** `knexfile.ts` is TypeScript and the knex CLI needs `ts-node`,
> which is in neither `package.json` nor `node_modules`. The script is a leftover. Migrations run
> from the compiled `dist/` at boot, which also means **every migration ships to every environment on
> deploy**, before the app accepts traffic.

### About `.env`

`.env` is gitignored; `.env.example` in the repo root is the template. Copy it and edit.

The important limitation: **`.env` is only read by `npm run start:dev`**, because only the
`watch-node` and `watch-node-feature` scripts pass `-r dotenv/config`. It is not read by
`npm run start-feature`, by `node dist/server.js`, or in deployed environments. Feature-mode
configuration comes from `feature.env` instead, and deployed configuration from helm.

### Roles

Three role levels, decoded from the `authorities` claim on your auth token in
`server/middleware/authorisationMiddleware.ts`:

| Role | Can do |
| --- | --- |
| *(none)* | Create reports; write statements for reports they are named on. |
| `ROLE_USE_OF_FORCE_REVIEWER` | Everything above, plus view all reports and statements for their **active caseload**. |
| `ROLE_USE_OF_FORCE_COORDINATOR` | Everything above, plus edit reports, delete reports, and add/remove involved staff. |

To exercise reviewer and coordinator journeys locally you need those roles on your `_GEN` account in
the dev auth environment. Note that reviewer list views are filtered by your **active caseload** at
the SQL level — if the list is empty, your caseload probably doesn't match the `agency_id` on the
reports in your database.

## Tests

### Unit tests

```bash
npm test                 # jest
npm run test-coverage    # with coverage
npm run typecheck        # tsc, no emit
npm run lint             # eslint
```

Unit tests are colocated with the code as `*.test.ts` / `*.test.js` under `server/` and `job/`.
Jest's configuration lives inside `package.json`, not a `jest.config.js`.

### Integration tests (Cypress)

Order matters here, and the reason is not obvious: `cypress.config.ts` and
`integration-tests/db/db.js` import from **`dist/`**, so the TypeScript must be compiled before
cypress runs. This is also why CI lints *after* building.

```bash
docker compose down                                  # free port 6379 first - see below
docker compose -f docker-compose.test.yml up -d       # postgres 5432, redis 6379, wiremock 9091
npm run build                                         # REQUIRED - cypress reads dist/
npm run start-feature                                 # app on port 3007
npm run int-test                                      # headless
npm run int-test-ui                                   # cypress UI
```

> **The two compose files conflict.** Both publish Redis on 6379 and both define a service literally
> named `use-of-force-redis`. You cannot run development and integration stacks at the same time —
> bring one down before starting the other.

Feature mode reads `feature.env`: the app listens on **3007**, and every upstream API is pointed at
wiremock on **9091**. Stubs live in `integration-tests/mockApis/`; database seeding helpers
(`seedReport`, `clearDb`) live in `integration-tests/db/db.js` and are exposed to specs as Cypress
tasks registered in `cypress.config.ts`.

## Pre-commit hooks

Installed by the `prepare` script. On commit they run gitleaks (secret scanning), lint-staged, then
`npm run typecheck && npm test`. Expect a commit to take a while. Put gitleaks false-positive
fingerprints in `.gitleaks/.gitleaksignore`.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `npm ci` fails with an engine error | Your Node major doesn't satisfy `package.json` `engines`, and `.npmrc` sets `engine-strict = true`. `nvm use` to get the `.nvmrc` version. |
| `gitleaks: command not found` on commit | `brew install gitleaks`. It isn't an npm dependency. |
| Cypress binary missing / cypress won't launch | You ran `npm install` instead of `npm run setup`. |
| Cypress fails on code you just changed | `dist/` is stale. `npm run build` before running cypress. |
| App starts but has no data, or writes vanish | Wrong database — see the port trap above. Set `DB_PORT=5433`. |
| Port 6379 already allocated | The other compose stack is running. `docker compose down` first. |
| Reviewer/coordinator list pages are empty | Your active caseload doesn't match the `agency_id` on the reports. List views are caseload-scoped in SQL. |
| No emails sent locally | Expected — GOV.UK Notify is not wired up locally. Do **not** "fix" it by setting `NOTIFY_ENABLED=true`; see [developer-tips.md](developer-tips.md#the-notify_enabled-trap). |
| `/health` returns 503 locally | Expected. The database check passes but hmpps-auth, prison-api and token-verification are not running locally, so they report `ECONNREFUSED`. Check the body — `"db": "OK"` means your database connection is right. |
| `Missing env var X` at boot | You are running with `NODE_ENV=production`. That variable is required in production; see `.env.example`. |

## Where to go next

- [architecture.md](architecture.md) — how the app is put together
- [creating-and-editing-a-report.md](creating-and-editing-a-report.md) — the pattern every form change follows
- [data-model.md](data-model.md) — the schema, and the soft-delete views you must query through
