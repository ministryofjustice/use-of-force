const auth = require('../mockApis/auth')
const { resetStubs } = require('../mockApis/wiremock')
const elite2api = require('../mockApis/elite2api')
const { clearDb } = require('../db/db')

module.exports = on => {
  on('task', {
    reset: () => Promise.all([clearDb(), resetStubs()]),

    getLoginUrl: auth.getLoginUrl,

    stubLogin: auth.stubLogin,

    stubOffenderDetails: id => elite2api.stubOffenderDetails(id),
  })
}
