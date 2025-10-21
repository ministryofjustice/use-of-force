import { defineConfig } from 'cypress'
import cypressSplit from 'cypress-split'
import auth from './integration-tests/mockApis/auth'
import { resetStubs } from './integration-tests/mockApis/wiremock'
import prisonApi from './integration-tests/mockApis/prisonApi'
import locationApi from './integration-tests/mockApis/locationApi'
import nomisMappingApi from './integration-tests/mockApis/nomisMappingApi'

import search from './integration-tests/mockApis/search'
import { stringToHash } from './server/utils/hash'

import db from './integration-tests/db/db'
import sConfig from './dist/server/config'

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
    setupNodeEvents(on, config) {
      on('task', {
        ...db,

        stringToHash: text => stringToHash(text, sConfig.email.urlSigningSecret),

        reset: () => Promise.all([db.clearDb(), resetStubs()]),

        getLoginUrl: auth.getLoginUrl,

        stubLogin: (user = {}) =>
          Promise.all([auth.stubLogin(user), prisonApi.stubUser(user), prisonApi.stubUserCaseloads()]),

        stubReviewerLogin: () =>
          Promise.all([auth.stubLogin({ isReviewer: true }), prisonApi.stubUser(), prisonApi.stubUserCaseloads()]),

        stubCoordinatorLogin: () =>
          Promise.all([auth.stubLogin({ isCoordinator: true }), prisonApi.stubUser(), prisonApi.stubUserCaseloads()]),

        stubOffenderDetails: prisonApi.stubOffenderDetails,

        stubOffenderImage: prisonApi.stubOffenderImage,

        stubOffenders: prisonApi.stubOffenders,

        stubLocation: locationApi.stubGetLocation,

        stubLocations: locationApi.stubGetLocations,

        stubLocationNotFound: locationApi.stubLocationNotFound,

        stubDpsLocationMapping: nomisMappingApi.stubGetDpsLocationMappingUsingNomisLocationId,

        stubPrisons: prisonApi.stubPrisons,

        stubSearch: search.stubSearch,

        stubPrison: prisonApi.stubPrison,

        stubUserDetailsRetrieval: auth.stubUserDetailsRetrieval,

        stubFindUsers: auth.stubFindUsers,

        stubUnverifiedUserDetailsRetrieval: auth.stubUnverifiedUserDetailsRetrieval,

        stubVerifyToken: active => auth.stubVerifyToken(active),

        stubClientCredentialsToken: auth.stubClientCredentialsToken,

        stubComponents: components.stubComponents,

        stubComponentsFail: components.stubComponentsFail,
      })
      cypressSplit(on, config)
      return config
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).js',
    specPattern: 'integration-tests/integration/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration-tests/support/index.js',
    experimentalRunAllSpecs: true,
  },
})
