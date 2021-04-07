const auth = require('../mockApis/auth')
const { resetStubs } = require('../mockApis/wiremock')
const prisonApi = require('../mockApis/prisonApi')
const search = require('../mockApis/search')
const { stringToHash } = require('../../dist/server/utils/hash')

const db = require('../db/db')
const config = require('../../dist/server/config')

module.exports = on => {
  on('task', {
    ...db,

    stringToHash: text => stringToHash(text, config.email.urlSigningSecret),

    reset: () => Promise.all([db.clearDb(), resetStubs()]),

    getLoginUrl: auth.getLoginUrl,

    stubLogin: (user = {}) =>
      Promise.all([auth.stubLogin(user), prisonApi.stubUser(user), prisonApi.stubUserCaseloads()]),

    stubReviewerLogin: () =>
      Promise.all([auth.stubLogin({ isReviewer: true }), prisonApi.stubUser(), prisonApi.stubUserCaseloads()]),

    stubCoordinatorLogin: () =>
      Promise.all([auth.stubLogin({ isCoordinator: true }), prisonApi.stubUser(), prisonApi.stubUserCaseloads()]),

    stubOffenderDetails: prisonApi.stubOffenderDetails,

    stubOffenders: prisonApi.stubOffenders,

    stubLocations: prisonApi.stubLocations,

    stubPrisons: prisonApi.stubPrisons,

    stubSearch: search.stubSearch,

    stubPrison: prisonApi.stubPrison,

    stubLocation: prisonApi.stubLocation,

    stubLocationNotFound: prisonApi.stubLocationNotFound,

    stubUserDetailsRetrieval: auth.stubUserDetailsRetrieval,

    stubFindUsers: auth.stubFindUsers,

    stubUnverifiedUserDetailsRetrieval: auth.stubUnverifiedUserDetailsRetrieval,

    stubVerifyToken: active => auth.stubVerifyToken(active),

    stubClientCredentialsToken: auth.stubClientCredentialsToken,
  })
}
