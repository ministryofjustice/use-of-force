const auth = require('../mockApis/auth')
const { resetStubs } = require('../mockApis/wiremock')
const elite2api = require('../mockApis/elite2api')
const { clearDb, getFormData } = require('../db/db')

module.exports = on => {
  on('task', {
    reset: () => Promise.all([clearDb(), resetStubs()]),

    getLoginUrl: auth.getLoginUrl,

    stubLogin: auth.stubLogin,

    stubOffenderDetails: elite2api.stubOffenderDetails,

    stubLocations: elite2api.stubLocations,

    getFormData: (userId, bookingId, formName) => getFormData(userId, bookingId, formName),
  })
}
