# Deployment notes

Deployment reference for the helm chart. For the full picture — pipeline, environments, secrets,
scheduled jobs — see [../docs/deployment.md](../docs/deployment.md).

## Environments

| Environment | Namespace | Host |
| --- | --- | --- |
| dev | `use-of-force-dev` | `dev.use-of-force.service.justice.gov.uk` |
| preprod | `use-of-force-preprod` | `preprod.use-of-force.service.justice.gov.uk` |
| prod | `use-of-force-prod` | `use-of-force.service.justice.gov.uk` |

All on the `live` Cloud Platform cluster.

## Layout

The chart lives in a subdirectory; the values files sit one level above it.

```
helm_deploy/
├── use-of-force/          <- the chart
│   ├── Chart.yaml
│   ├── values.yaml        <- shared values
│   └── templates/job.yaml <- the send-reminders CronJob
├── values-dev.yaml
├── values-preprod.yaml
└── values-prod.yaml
```

Paths in the commands below are relative to the repository root, not to this directory.

## Prerequisites

A helm v3 client:

```sh
helm version
```

## Useful commands

**Render the chart locally** — outputs the fully rendered Kubernetes resources as YAML:

```sh
helm template helm_deploy/use-of-force --values helm_deploy/values-dev.yaml
```

**List releases:**

```sh
helm --namespace use-of-force-dev list
```

**List current and previous application versions:**

```sh
helm --namespace use-of-force-dev history use-of-force
```

**Roll back:**

```sh
helm --namespace use-of-force-dev rollback use-of-force [revision] --wait
```

Take the revision number from the `history` output.

**Lint before pushing** — CI runs this for all three environments:

```sh
helm lint helm_deploy/use-of-force --values helm_deploy/values-dev.yaml
```

## Deploying

Deploys run in GitHub Actions, not by hand, via
`ministryofjustice/hmpps-github-actions/.github/workflows/deploy_env.yml@v2`. A merge to `main`
deploys through dev, preprod and prod in sequence. To deploy a specific version to a single
environment, run the `deploy_to_env.yml` workflow manually and pick the environment and version.

Secrets are not passed on the command line — they come from the four Kubernetes secrets mapped in
`values.yaml` under `namespace_secrets` (`dps-rds-instance-output`, `application-insights`,
`use-of-force`, `uof-elasticache-redis`). See [../docs/deployment.md](../docs/deployment.md#secrets).

To test a rendered upgrade without applying it, add `--dry-run` to a `helm upgrade` against the
namespace you have access to.

## Ingress TLS certificate

The certificate definition lives in the
[cloud-platform-environments](https://github.com/ministryofjustice/cloud-platform-environments) repo,
under the relevant namespace folder:

```
namespaces/live.cloud-platform.service.justice.gov.uk/use-of-force-dev/05-certificate.yaml
```

The name of the Kubernetes secret holding the certificate is passed to the chart as
`ingress.tlsSecretName` (currently `use-of-force-cert`) and used to configure the ingress.

## Database migrations

Migrations are **not** a separate deployment step. `server.ts` runs `knex.migrate.latest()` before
`app.listen()`, so each deploy applies outstanding migrations as the new pods start. Migrations must
be fast and backward-compatible with the version being replaced, since old and new pods share the
schema during a rolling deploy.
