import { defineConfig } from 'cypress'

import auth from './integration-tests/mockApis/auth'
import { resetStubs } from './integration-tests/mockApis/wiremock'
import prisonApi from './integration-tests/mockApis/prisonApi'
import prisonRegister from './integration-tests/mockApis/prisonRegister'
import manageUsersApi from './integration-tests/mockApis/manageUsersApi'
import locationApi from './integration-tests/mockApis/locationApi'
import nomisMappingApi from './integration-tests/mockApis/nomisMappingApi'

import search from './integration-tests/mockApis/search'
import { stringToHash } from './server/utils/hash'

import db from './integration-tests/db/db'
import config from './dist/server/config'

import components from './integration-tests/mockApis/components'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration-tests/fixtures',
  screenshotsFolder: 'integration-tests/screenshots',
  videosFolder: 'integration-tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  taskTimeout: 60000,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on) {
      on('task', {
        ...db,

        stringToHash: text => stringToHash(text, config.email.urlSigningSecret),

        reset: () => Promise.all([db.clearDb(), resetStubs()]),

        getLoginUrl: auth.getLoginUrl,

        stubLogin: (user = {}) => Promise.all([auth.stubLogin(user), manageUsersApi.stubCurrentUser()]),

        stubReviewerLogin: () => Promise.all([auth.stubLogin({ isReviewer: true }), manageUsersApi.stubCurrentUser()]),

        stubCoordinatorLogin: () =>
          Promise.all([auth.stubLogin({ isCoordinator: true }), manageUsersApi.stubCurrentUser()]),

        stubOffenderDetails: prisonApi.stubOffenderDetails,

        stubOffenderImage: prisonApi.stubOffenderImage,

        stubOffenders: search.stubPrisonerNames,

        stubLocation: locationApi.stubGetLocation,

        stubLocations: locationApi.stubGetLocations,

        stubLocationNotFound: locationApi.stubLocationNotFound,

        stubDpsLocationMapping: nomisMappingApi.stubGetDpsLocationMappingUsingNomisLocationId,

        stubPrisons: prisonRegister.stubPrisons,

        stubSearch: search.stubSearch,

        stubPrison: prisonRegister.stubPrison,

        stubUserDetailsRetrieval: auth.stubUserDetailsRetrieval,

        stubFindUsers: auth.stubFindUsers,

        stubUnverifiedUserDetailsRetrieval: auth.stubUnverifiedUserDetailsRetrieval,

        stubVerifyToken: active => auth.stubVerifyToken(active),

        stubClientCredentialsToken: auth.stubClientCredentialsToken,

        stubComponents: components.stubComponents,

        stubComponentsFail: components.stubComponentsFail,

        stubStaffMemberSearch: manageUsersApi.stubStaffMemberSearch,

        stubGetUser: manageUsersApi.stubGetUser,
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).js',
    specPattern: 'integration-tests/integration/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration-tests/support/index.js',
    experimentalRunAllSpecs: true,
  },
})
