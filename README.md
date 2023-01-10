# Use of Force
[![CircleCI](https://circleci.com/gh/ministryofjustice/use-of-force/tree/main.svg?style=svg)](https://circleci.com/gh/ministryofjustice/use-of-force)
[![repo standards badge](https://img.shields.io/badge/dynamic/json?color=blue&style=for-the-badge&logo=github&label=MoJ%20Compliant&query=%24.result&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fuse-of-force)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-github-repositories.html#use-of-force "Link to report")

A service to allow recording of Use of Force incidents.

### Dependencies
The app requires: 
* A postgres DB to store report information
* A REDIS instance for storing sessions


## Getting started
The easiest way to run the app is to use docker compose to start local postgres and redis DBs

`docker-compose pull`
`docker-compose up`

Install dependencies using `npm install`, ensuring you are using >= `Node v16`

And then, to build the assets and start the app with nodemon:
`npm run start:dev`

### Accessing the application
Use your _GEN development credentials

### user roles
a reviewer is able to see all incidents on their current caseload:
a force coordinator will additionally be able to add or delete staff and remove reports:


### urls
Once the use of force app has started, there are multiple ways to access the app.

* To create a report: 
http://localhost:3000/report/-1/report-use-of-force (where -1 represents a booking id)

* To view reports and statements: 
http://localhost:3000/

If new nomis is running you can access the home page at http://localhost:3001. 
Only the leeds caseload has been configured to support use-of-force.

There are two ways of entering use-of-force from new-nomis:
1.) Go to the new nomis homepage and click 'Use of force incidents' to view the user's reports/statements
2.) Go to the new nomis homepage, search for an offender and click 'Report use of force' from the quick details page.

#### Env variables
In config.js you can see all the required variables. These are set with defaults that will allow the application to run, but you will need to add a `.env` file at some point.

### Run linter

`npm run lint`

### Run tests

`npm run test`

### Running integration tests

For local running, start a test db, redis, and wiremock instance by:

`docker-compose -f docker-compose.test.yml up`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with nodemon)

And then either, run tests in headless mode with:

`npm run int-test`
 
Or run tests with the cypress UI:

`npm run int-test-ui`