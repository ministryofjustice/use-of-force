const auth = require('../mockApis/auth')
const { resetStubs } = require('../mockApis/wiremock')
const elite2api = require('../mockApis/elite2api')
const search = require('../mockApis/search')

const db = require('../db/db')

module.exports = on => {
  on('task', {
    ...db,

    reset: () => Promise.all([db.clearDb(), resetStubs()]),

    getLoginUrl: auth.getLoginUrl,

    stubLogin: (user = {}) =>
      Promise.all([auth.stubLogin(user), elite2api.stubUser(user), elite2api.stubUserCaseloads()]),

    stubReviewerLogin: () =>
      Promise.all([auth.stubLogin({ isReviewer: true }), elite2api.stubUser(), elite2api.stubUserCaseloads()]),

    stubCoordinatorLogin: () =>
      Promise.all([auth.stubLogin({ isCoordinator: true }), elite2api.stubUser(), elite2api.stubUserCaseloads()]),

    stubOffenderDetails: elite2api.stubOffenderDetails,

    stubOffenders: elite2api.stubOffenders,

    stubLocations: elite2api.stubLocations,

    stubPrisons: elite2api.stubPrisons,

    stubSearch: search.stubSearch,

    stubPrison: elite2api.stubPrison,

    stubLocation: elite2api.stubLocation,

    stubUserDetailsRetrieval: auth.stubUserDetailsRetrieval,

    stubFindUsers: auth.stubFindUsers,

    stubUnverifiedUserDetailsRetrieval: auth.stubUnverifiedUserDetailsRetrieval,

    stubVerifyToken: active => auth.stubVerifyToken(active),
  })
}
