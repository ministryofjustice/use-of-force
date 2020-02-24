const auth = require('../mockApis/auth')
const { resetStubs } = require('../mockApis/wiremock')
const elite2api = require('../mockApis/elite2api')
const {
  clearDb,
  getCurrentDraft,
  getStatementForUser,
  getAllStatementsForReport,
  seedReport,
  getPayload,
  submitStatement,
} = require('../db/db')

module.exports = on => {
  on('task', {
    reset: () => Promise.all([clearDb(), resetStubs()]),

    getLoginUrl: auth.getLoginUrl,

    stubLogin: () =>
      Promise.all([auth.stubLogin({ isReviewer: false }), elite2api.stubUser(), elite2api.stubUserCaseloads()]),

    stubReviewerLogin: () =>
      Promise.all([auth.stubLogin({ isReviewer: true }), elite2api.stubUser(), elite2api.stubUserCaseloads()]),

    stubOffenderDetails: elite2api.stubOffenderDetails,

    stubOffenders: elite2api.stubOffenders,

    stubLocations: elite2api.stubLocations,

    getCurrentDraft: (userId, bookingId, formName) => getCurrentDraft(userId, bookingId, formName),

    stubLocation: elite2api.stubLocation,

    getStatementForUser,

    getAllStatementsForReport,

    getPayload,

    seedReport,

    stubUserDetailsRetrieval: auth.stubUserDetailsRetrieval,

    stubUnverifiedUserDetailsRetrieval: auth.stubUnverifiedUserDetailsRetrieval,

    submitStatement,
  })
}
