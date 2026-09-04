# Use of Force — developer documentation

Use of Force (UoF) is the DPS service prison staff use to record incidents where force was used
against a prisoner. A member of staff creates a **report** describing the incident; every other
member of staff named on that report is then asked for their own **statement**. Once all statements
are in, the report is complete. Reviewers and coordinators at the prison oversee the process.

If you have worked on other HMPPS services, the thing to know up front is that **Use of Force has no
backing API for writes**. This Express app owns the Postgres schema outright and does all
transactional work itself, in hand-written SQL. There is a Kotlin service, `hmpps-uof-data-api`, but
it is read-only and exists to serve Subject Access Requests. See
[architecture.md](architecture.md#what-makes-use-of-force-different).

## Where to start

New to the service? Read in this order: **getting started → architecture → creating and editing a
report → data model**. The rest are reference.

| Document | Read this when… |
| --- | --- |
| [getting-started.md](getting-started.md) | You want the app running locally, tests passing, and to know the traps that cost people a day. |
| [architecture.md](architecture.md) | You need the shape of the app — layers, middleware, auth, which upstream APIs it calls. |
| [creating-and-editing-a-report.md](creating-and-editing-a-report.md) | You are about to change a form page, add a question, or touch the coordinator edit flow. |
| [data-model.md](data-model.md) | You are writing a query or a migration, or wondering why a row you deleted is still there. |
| [report-payload.md](report-payload.md) | You need to know what is actually inside `report.form_response`. |
| [process-flows.md](process-flows.md) | You need the report and statement lifecycles, or the reminder job's behaviour. |
| [developer-tips.md](developer-tips.md) | You want the environment variables, the npm scripts, debugging recipes, or the domain glossary. |
| [deployment.md](deployment.md) | You are shipping, or looking for a namespace, secret or alert route. |

## Repository layout

| Path | What lives there |
| --- | --- |
| `server/` | The application. Routes, services, data access, Nunjucks views, config. |
| `migrations/` | Knex migrations. These own the database schema — see [data-model.md](data-model.md). |
| `job/` | The `send-reminders` batch job, run as a Kubernetes CronJob. |
| `integration-tests/` | Cypress specs, page objects, wiremock stubs and DB seeding helpers. |
| `helm_deploy/` | Helm chart and per-environment values. |
| `assets/` | SCSS and client-side JS. |
| `docs/` | You are here. |
