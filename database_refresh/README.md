# Database refresh - Prod to Preprod

This folder contains the following kubernetes config:

- `01-configmap-refresh-script.yaml` Defines the bash script used to perform the db dump and restore
- `02-cronjob.yaml` Defines the cronjob which launches the job on a weekly basis.
- `03-prometheus-alert.yaml` Define alert which will tell us if the refresh job failed, alert sent to `#dps_alerts`

If setting this up for the first time **_use extreme caution_** - this job connects to production databases.

**_Ensure that all environment variables are named and setup correctly._**

Also check that the rule defined in `03-prometheus-alert.yaml` has the correct namespace specified, update the the rule if needed.

### Prerequisite:

For this job to work the preprod database credentials need to be available production namespace. This is achieved by having terraform export the preprod credentials, which is an output of the terraform rds module, to a secret in the production namespace. See this example:

<https://github.com/ministryofjustice/cloud-platform-environments/blob/master/namespaces/live-1.cloud-platform.service.justice.gov.uk/use-of-force-preprod/resources/rds.tf#L41-L56>

### Overview

The refresh job performs a `pg_dump` using the existing production credentials, already setup in in the production namespace of the application. The job then uses the preprod credentials (see prerequisite) for the `pg_restore`.

In sync with the main oracle database refreshes this cronjob runs every other Sunday (odd weeks). Slight caveat is that is it difficult to define a cron schedule that runs every other week. So this cron is scheduled for every week however the executed script checks if the week is an odd or even number and only executes the refresh on odd numbered weeks.

### Installation of cronjob

```bash
kubectl -n use-of-force-prod apply -f 01-configmap-refresh-script.yaml
kubectl -n use-of-force-prod apply -f 02-cronjob.yaml
kubectl -n use-of-force-prod apply -f 03-prometheus-alert.yaml
```

### Run an adhoc database refresh

`adhoc-db-refresh-job.yaml` contains config similar to the cronjob above - however it is a one off job that will run immediately. **_Please look carefully at it before executing._**

Create the job:

```bash
kubectl -n use-of-force-prod apply -f adhoc-db-refresh-job.yaml
```

Check the job is running, and see what pods have been created:

```bash
kubectl -n use-of-force-prod describe jobs db-refresh-script-adhoc
```

Get the logs from the pod:

```bash
kubectl -n use-of-force-prod logs [pod name]
```

When finished, delete the job:

```bash
kubectl -n use-of-force-prod delete jobs.batch db-refresh-script-adhoc
```

### Troubleshooting

Get or Describe cron job:

```bash
kubectl -n use-of-force-prod get cronjobs.batch
kubectl -n use-of-force-prod describe cronjobs.batch db-refresh-job
```

List of previously run jobs:

```bash
kubectl -n use-of-force-prod get jobs
```

View details of job and find pod names:

```bash
kubectl -n use-of-force-prod describe jobs [name of job]
```

Get logs from last run:

```bash
kubectl -n use-of-force-prod logs [name of pod]
```