const auth = require('../mockApis/auth')
const { resetStubs } = require('../mockApis/wiremock')
const elite2api = require('../mockApis/elite2api')
const { clearDb, getCurrentDraft, getStatement } = require('../db/db')

module.exports = on => {
  on('task', {
    reset: () => Promise.all([clearDb(), resetStubs()]),

    getLoginUrl: auth.getLoginUrl,

    stubLogin: () => Promise.all([auth.stubLogin(), elite2api.stubUser(), elite2api.stubUserCaseloads()]),

    stubOffenderDetails: elite2api.stubOffenderDetails,

    stubOffenders: elite2api.stubOffenders,

    stubLocations: elite2api.stubLocations,

    getCurrentDraft: (userId, bookingId, formName) => getCurrentDraft(userId, bookingId, formName),

    stubLocation: elite2api.stubLocation,

    getStatement,

    stubUserDetailsRetrieval: auth.stubUserDetailsRetrieval,
  })
}
