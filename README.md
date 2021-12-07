# Use of Force
[![CircleCI](https://circleci.com/gh/ministryofjustice/use-of-force/tree/main.svg?style=svg)](https://circleci.com/gh/ministryofjustice/use-of-force)
[![Known Vulnerabilities](https://snyk.io/test/github/ministryofjustice/use-of-force/badge.svg)](https://snyk.io/test/github/ministryofjustice/use-of-force)

A service to allow recording of Use of Force incidents.

## Getting started
The easiest way to run the app is to use docker compose to build the local app as a docker image and download and run the three required containers.

`docker-compose pull`

`docker-compose up`

### Dependencies
The app requires: 
* `HMPPs Auth Service` for authentication
* `prison-api` to retrieve offender and prison information
* It's own postgres DB to store report information
* A REDIS instance for storing sessions

### Runing the app for development**

To start the main services excluding the use of force app: 
`docker-compose up --scale=use-of-force=0`

Install dependencies using `npm install`, ensuring you are using >= `Node v16`

And then, to build the assets and start the app with nodemon:
`npm run start:dev`

### Accessing the application

Any of the seed users should be able to raise incidents and view their incidents and statements, e.g:
username: `ITAG_USER`, password: `password`
username: `CA_USER`,   password: `password123456`


There is a reviewer user who will additionally be able to see all incidents on their current caseload:
username: `UOF_REVIEWER_USER`, password: `password123456`

You can log in as a use of force coordinator in the sample data with the user who will additionally be able to add or delete staff and remove reports:
username: `UOF_COORDINATOR_USER` password:`password123456`

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