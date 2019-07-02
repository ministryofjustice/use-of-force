# Use of ForceForm
A service to allow recording of Use of Force incidents.

## Getting started
The easiest way to get started is to use docker compose to download and run the three required containers.

`docker-compose pull`

`docker-compose up`

### Users
You can log in with users stored in the seeded nomis oauth db e.g. `CA_USER, password123456`

### Dependencies
The app authenticates using `Nomis Oauth2 Server` and saves to a Postgres database.
It retrieve offender info from the elite2api.

### Runing the app for development**

#### Start required downstream services: 

To start all services excluding the use of force app: 
`docker-compose up --scale=use-of-force=0`

#### Build assets
`npm run build`

Install dependencies using `npm install` ensure you are using >= `Node v10.15.3`

To set up external services to allow local development:

`docker-compose up use-of-force-db oauth-server elite2-api`

And then start the app:
`npm start`

#### Env variables
In config.js you can see all the required variables. These are set with defaults that will allow the application to run, but you will need to add a `.env` file at some point.

`npm run start`

### Run linter

`npm run lint`

### Run tests

`npm run test`

### Running integration tests

For local running, start a db and wiremock instance by:

`docker-compose -f docker-compose.test.yml up`

Run the server in test mode by:

`npm run start-feature`

And then run tests in headless mode with:

`npm run int-test`

To run tests with the cypress UI:

`npm run int-test-ui`
