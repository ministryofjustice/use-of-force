# Developer tips

Reference material: environment variables, npm scripts, debugging recipes, known traps, and a
glossary of the domain language.

## Environment variables

Full list from `server/config.ts`. "Required in prod" means the app throws `Missing env var X` at
boot when `NODE_ENV=production` and the variable is absent. Everything has a local default, so the
app starts with none of them set. `.env.example` in the repo root is the template.

### Database and Redis

| Variable | Default | Req. in prod | Notes |
| --- | --- | --- | --- |
| `DB_SERVER` | `localhost` | | |
| `DB_PORT` | `5432` | | **Set to 5433 locally** — see the port trap in [getting-started.md](getting-started.md#the-database-port-trap). |
| `DB_NAME` / `DB_USER` / `DB_PASS` | `use-of-force` | | |
| `DB_SSL_ENABLED` | `false` | | When true, reads `root.cert` (the RDS truststore) from the working directory. |
| `REDIS_ENABLED` | `false` | ✔ | False uses an in-memory session store. |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | | |
| `REDIS_TLS_ENABLED` | `false` | | True switches the client to `rediss://`. |
| `REDIS_AUTH_TOKEN` | — | | |

### Session and security

| Variable | Default | Req. in prod | Notes |
| --- | --- | --- | --- |
| `SESSION_SECRET` | `app-insecure-default-session` | ✔ | |
| `WEB_SESSION_TIMEOUT_IN_MINUTES` | `120` | ✔ | Rolling. |
| `URL_SIGNING_SECRET` | `someUrlSigningSecret` | ✔ | HMAC key for unauthenticated removal-request links. |

### Auth

| Variable | Default | Req. in prod | Notes |
| --- | --- | --- | --- |
| `NOMIS_AUTH_URL` | `http://localhost:9090/auth` | ✔ | Server-to-server token endpoint. |
| `NOMIS_AUTH_EXTERNAL_URL` | falls back to `NOMIS_AUTH_URL` | | Browser-facing authorize endpoint. |
| `API_CLIENT_ID` / `API_CLIENT_SECRET` | `use-of-force-client` / `clientsecret` | ✔ | User OAuth flow. |
| `SYSTEM_CLIENT_ID` / `SYSTEM_CLIENT_SECRET` | fall back to `API_*` | ✔ | Client-credentials calls. |
| `TOKENVERIFICATION_API_URL` | `http://localhost:8100` | ✔ | |
| `TOKENVERIFICATION_API_ENABLED` | `false` | | Must be the literal string `true` to enable. |

### Upstream APIs

All required in production. Each also accepts `<NAME>_TIMEOUT_RESPONSE` and
`<NAME>_TIMEOUT_DEADLINE` in milliseconds, default 10000.

| Variable | Default | Used for |
| --- | --- | --- |
| `PRISON_API_URL` | `:8080` | Bookings, agencies, caseloads, offender photos. |
| `HMPPS_MANAGE_USERS_API_URL` | `:8081` | Staff lookup and email addresses. |
| `PRISONER_SEARCH_API_URL` | `:8080` | Prisoner search. |
| `LOCATIONS_INSIDE_PRISON_API_URL` | `:8080` | Non-residential incident locations. |
| `NOMIS_MAPPING_API_URL` | `:8080` | NOMIS location id → DPS UUID, for legacy reports. |
| `COMPONENT_API_URL` | `:8082` | Shared header and footer. Timeout is `COMPONENT_API_TIMEOUT_SECONDS`, default 2000. |

### URLs

| Variable | Default | Req. in prod | Notes |
| --- | --- | --- | --- |
| `INGRESS_URL` | `http://localhost:3000` | ✔ | This app's own base URL; the OAuth callback is built from it. |
| `DPS_URL` | `http://localhost:3000` | ✔ | |
| `EMAIL_LOCATION_URL` | `http://localhost:3000` | ✔ | Base for emailed deep links. |
| `EXIT_LOCATION_URL` | `/` | ✔ | Header "Exit" link. |
| `PORT` | `3000` | | Read directly in `server/app.ts`, not through config. |

### Notify

| Variable | Default | Req. in prod | Notes |
| --- | --- | --- | --- |
| `NOTIFY_API_KEY` | `invalid-token` | ✔ | |
| `NOTIFY_ENABLED` | `true` (boolean) | | **See the trap below — do not set this.** |
| `TEMPLATE_REPORTER_REMINDER` / `TEMPLATE_REPORTER_OVERDUE` | hard-coded ids | | Involved-staff template ids are hard-coded in `config.ts` and not overridable. |

### Feature flags and build info

| Variable | Default | Req. in prod | Notes |
| --- | --- | --- | --- |
| `MAX_WEEKS_TO_SUBMIT_OR_EDIT_REPORT` | `13` | | Weeks from the incident date. |
| `FEATURE_FLAG_REMOVE_CELL_LOCATION_AGENCIES` | `''` | | Comma-separated prison codes. Split on `,` — do not quote the value. |
| `FEATURE_FLAG_OUTAGE_BANNER_ENABLED` | `false` | ✔ | |
| `ENVIRONMENT_NAME` | `''` | | Shown in the environment banner. Empty in production. |
| `BUILD_NUMBER`, `PRODUCT_ID`, `GIT_REF`, `GIT_BRANCH` | | ✔ | Injected by the Docker build. `PRODUCT_ID` is `DPS045`. |
| `APPLICATIONINSIGHTS_CONNECTION_STRING`, `TAG_MANAGER_KEY`, `TAG_MANAGER_ENVIRONMENT` | | | Telemetry. Leave unset locally. |

### The `NOTIFY_ENABLED` trap

**Setting `NOTIFY_ENABLED=true` disables notifications.** `config.email.enabled` is
`get('NOTIFY_ENABLED', true)`, which returns the *string* `'true'` when the environment variable is
present, but `server/services/notificationService.ts` tests `enabled === true` before constructing a
real `NotifyClient`. A string never satisfies that, so any value at all falls through to the stub.

It works in deployed environments only because helm never sets the variable, letting the boolean
default through. Leave it unset. Fixing this is a tracked follow-up.

### `feature.env` quoting

`npm run start-feature` loads `feature.env` with `export $(cat feature.env)`, which does **no quote
removal and no escaping**. Two live consequences:

- `NODE_ENV=development` has a trailing space in the file.
- `FEATURE_FLAG_REMOVE_CELL_LOCATION_AGENCIES='HMI'` keeps its literal single quotes, so the value is
  `'HMI'`, not `HMI`.

Don't add quotes or spaces to that file.

## npm scripts

| Script | What it does |
| --- | --- |
| `setup` | `npm ci && hmpps-npm-script-run-allowlist`. **The correct bootstrap.** |
| `build` | `compile-sass && tsc && copy-views`. |
| `start:dev` | Build, then four concurrent watchers (TS, Sass, views, nodemon). Port 3000. |
| `start-feature` | Loads `feature.env`, runs `dist/server.js`. Port 3007. Wiremock-backed. |
| `start-feature:dev` | As above with nodemon. |
| `test` / `test-coverage` / `test:ci` | Jest. |
| `int-test` / `int-test-ui` | Cypress headless / UI. Requires a prior `npm run build`. |
| `lint` | `eslint . --cache --max-warnings 50`. Note the 50-warning budget. |
| `typecheck` | `tsc` with no emit. |
| `compile-sass` / `watch-sass` | SCSS → `assets/stylesheets/application.css`. |
| `copy-views` / `watch-views` | Nunjucks templates into `dist/`. They are copied, not compiled. |
| `send-reminders` | Runs the reminder job locally. Forces `DB_PORT=5433`. |
| `security_audit` | `audit-ci` against `audit-ci.json`. |
| `record-build-info` | Writes `build-info.json`. Used by the Docker build. |
| `generate-prisoner-search-api-types` | Regenerates `server/types/prisonerSearchApi/index.d.ts` from the dev environment's OpenAPI spec. |
| `generate-locations-api-types` | Same, for locations-inside-prison. |
| `generate-manage-users-api-types` | Same, for manage-users. |
| `precommit:secrets` / `:lint` / `:verify` | Run by the husky hook. |
| `migrate` | **Broken — do not use.** See below. |

Two absences worth knowing:

- **There is no `start` script**, yet the Dockerfile ends with `CMD ["npm","start"]`. It works only
  because npm falls back to `node server.js`, and the Dockerfile copies the *contents* of `dist/`
  into `/app`. Fragile; a tracked follow-up.
- **`npm run migrate` does not work.** `knexfile.ts` is TypeScript and the knex CLI needs `ts-node`,
  which is in neither `package.json` nor `node_modules`. Migrations run at application boot from
  `server.ts` instead.

## Testing conventions

- Jest configuration is **inside `package.json`**, not a `jest.config.js`. Tests are colocated as
  `*.test.ts` next to the code, under `server/` and `job/`.
- `collectCoverageFrom` covers `server/**` only, so **`job/` is tested but excluded from coverage**.
- ts-jest runs with `isolatedModules: true` — type errors do not fail tests. Run `npm run typecheck`
  separately.
- Cypress specs are in `integration-tests/integration/`, page objects in `integration-tests/pages/`.
- Upstream APIs are stubbed with wiremock; stubs are in `integration-tests/mockApis/` and registered
  as Cypress tasks in `cypress.config.ts` (`stubLogin`, `stubCoordinatorLogin`, `stubOffenderDetails`,
  `stubLocations`, …).
- Database seeding is `integration-tests/db/db.js`: `seedReport`, `seedReports`, `submitStatement`,
  `getReport`, `clearDb`. `clearDb` truncates in FK order.
- **`integration-tests/db/db.js` and `cypress.config.ts` import from `dist/`**, so build before
  running cypress or lint. This is why CI lints after building.
- `integration-tests/integration/seedData.js` holds the canonical `expectedPayload` fixture. Start
  from it rather than hand-writing report JSON.

## Debugging

```bash
# readable logs - the app emits bunyan JSON
node dist/server.js | bunyan -o short

# the dev database
psql -h localhost -p 5433 -U use-of-force use-of-force

# a report payload, pretty-printed
psql -h localhost -p 5433 -U use-of-force use-of-force \
  -c "select id, status, jsonb_pretty(form_response) from v_report order by id desc limit 1;"

# what happened to a report
psql -h localhost -p 5433 -U use-of-force use-of-force \
  -c "select timestamp, username, action, details from report_log where report_id = 1 order by id;"

# app and dependency health
curl -s localhost:3000/health | jq
```

Remember to query the `v_*` views rather than the base tables unless you specifically want to see
soft-deleted rows.

## Pre-commit hooks

Installed by the `prepare` script (husky v9). On commit: gitleaks secret scan → lint-staged →
`npm run typecheck && npm test`. Expect commits to be slow.

- `gitleaks` must be on your PATH (`brew install gitleaks`); it is not an npm dependency.
- False-positive fingerprints go in `.gitleaks/.gitleaksignore`.
- The `husky.hooks` block still in `package.json` is husky v4 format and is ignored.
- The hook has a known line-continuation bug that means the final standalone `tsc` never runs. It is
  a tracked follow-up; `precommit:verify` still runs `typecheck` regardless.

## Dependency landscape

Several dependencies are well behind current, deliberately or otherwise. Don't be surprised, and
check before assuming a modern API is available:

| Package | Here | Note |
| --- | --- | --- |
| express | 4.x | Not v5. |
| knex | 2.x | Migrations only. A major behind. |
| `@hapi/joi` | 17 | The deprecated package name; current is `joi`. |
| helmet | 6 | |
| applicationinsights | 2 | Not v3. |
| eslint | 8 + typescript-eslint 5 | Legacy `.eslintrc.json`, not flat config. |
| `@types/node` | 18 | While running Node 22+. |
| moment **and** date-fns | both present | New code should use date-fns. |
| govuk-elements-sass | 3.x | Legacy; tied to the custom `build.yml` in CI. |

`.allowed-scripts.mjs` pins exact versions for the six packages allowed to run install scripts. A
Renovate bump to any of them must update that file in the same PR or `npm run setup` breaks.

`audit-ci.json` suppresses two long-lived advisories tied to the eslint 8 and knex 2 stacks.

## Glossary

| Term | Meaning |
| --- | --- |
| **UoF** | Use of Force. |
| **Report** | The record of an incident, created by one member of staff (the reporter). |
| **Statement** | One member of staff's own account of the incident. One per involved staff member. |
| **Reporter** | The member of staff who created the report. They also provide a statement. |
| **Involved staff** | Everyone named on the report as having been present. Each is asked for a statement. |
| **Reviewer** | `ROLE_USE_OF_FORCE_REVIEWER`. Can see all reports and statements for their caseload. |
| **Coordinator** | `ROLE_USE_OF_FORCE_COORDINATOR`. Can additionally edit and delete reports and manage involved staff. |
| **Booking id** | NOMIS identifier for a prisoner's current period in custody. Changes between sentences. |
| **Offender number / prison number** | The prisoner's stable identifier, e.g. `A1234AC`. |
| **Caseload / agency id** | The prison a user is currently working at, e.g. `MDI`. Reviewer list views are scoped to it. |
| **Planned use of force** | Force that was anticipated and authorised in advance, as opposed to spontaneous. Drives the `authorisedBy` question. |
| **PAVA** | An incapacitant spray. The report records whether it was drawn and whether it was used. |
| **C&R / control and restraint positions** | Standard restraint positions — standing, on back, face down, kneeling. `ControlAndRestraintPosition` in `server/config/types.ts`. |
| **Pain-inducing techniques** | A specific, separately recorded category of restraint technique. |
| **Guiding hold / escorting hold** | Lower-level physical holds, recorded separately from restraint positions. |
| **F213** | The prison healthcare form completed after an injury. The report records who completed it. |
| **Relocation** | Where the prisoner was taken afterwards — segregation unit, own cell, and so on. |
| **Body-worn camera** | Recorded per incident, with camera numbers. |
| **DPS** | Digital Prison Services, the wider service this sits inside. Older code and docs may say "new NOMIS". |
| **NOMIS** | The legacy prison system. Still the source of bookings, agencies and caseloads via prison-api. |
