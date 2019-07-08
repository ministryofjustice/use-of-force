# Use of Force
A service to allow recording of Use of Force incidents.

## Getting started
The easiest way to run the app is to use docker compose to build the local app as a docker image and download and run the three required containers.

`docker-compose pull`

`docker-compose up`

### Users
You can log in with users stored in the seeded nomis oauth db e.g. `CA_USER, password123456`

### Dependencies
The app requires: 
* `Nomis Oauth2 Server` for authentication
* `elite2-api` to retrieve offender and prison information
* It's own postgres DB to store report information

### Runing the app for development**

#### Start required downstream services: 

To start all services excluding the use of force app: 
`docker-compose up --scale=use-of-force=0`

Install dependencies using `npm install`, ensuring you are using >= `Node v10.15.3`

And then, to build the assets and start the app with nodemon:
`npm run start:dev`

#### Env variables
In config.js you can see all the required variables. These are set with defaults that will allow the application to run, but you will need to add a `.env` file at some point.

### Run linter

`npm run lint`

### Run tests

`npm run test`

### Running integration tests

For local running, start a test db and wiremock instance by:

`docker-compose -f docker-compose.test.yml up`

Then run the server in test mode by:

`npm run start-feature`

And then either, run tests in headless mode with:

`npm run int-test`
 
Or run tests with the cypress UI:

`npm run int-test-ui`
