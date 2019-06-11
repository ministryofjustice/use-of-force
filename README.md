# Form app starter
A simple starter kit to start writing form based node app with the gov uk front end toolkit.


## Getting started
The easiest way to get started is to use docker compose to download and run the three required containers.

`docker-compose pull`

`docker-compose up`

for detailed instructions see `https://dsdmoj.atlassian.net/wiki/spaces/NFS/overview`

### Users
You can log in with users stored in the seeded nomis oauth db e.g. `CA_USER, password123456`

### Dependencies
The app authenticates using nomis `Nomis Oauth2 Server` and saves to a Postgres database.

### Runing the app for development**

#### Build assets
`npm run build`

Install dependencies using `npm install` ensure you are using >= `Node v10.15.3`

#### Env variables
In config.js you can see all the required variables. These are set with defaults that will allow the application to run, but you will need to add a `.env` file at some point.

`npm run start`

### Run linter

`npm run lint`

### Run tests

`npm run test`
