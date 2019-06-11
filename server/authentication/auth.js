const passport = require('passport')
const { Strategy } = require('passport-oauth2')
const { URLSearchParams } = require('url')
const config = require('../config')
const { generateOauthClientToken } = require('./oauth')

function authenticationMiddleware() {
  // eslint-disable-next-line
  return (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }

    const redirectPath = '/login'
    const query = req.get('referrer') ? new URLSearchParams({ target: req.originalUrl }) : null
    const redirectUrl = query ? `${redirectPath}?${query}` : redirectPath
    return res.redirect(redirectUrl)
  }
}

passport.serializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user)
})

passport.deserializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user)
})

function init(signInService) {
  const strategy = new Strategy(
    {
      authorizationURL: `${config.nomis.authExternalUrl}/oauth/authorize`,
      tokenURL: `${config.nomis.authUrl}/oauth/token`,
      clientID: config.nomis.apiClientId,
      clientSecret: config.nomis.apiClientSecret,
      callbackURL: `${config.domain}/login/callback`,
      state: true,
      customHeaders: { Authorization: generateOauthClientToken() },
    },
    (accessToken, refreshToken, params, profile, done) => {
      const user = signInService.getUser(accessToken, refreshToken, params.expires_in, params.user_name)

      return done(null, user)
    }
  )

  passport.use(strategy)
}

module.exports.init = init
module.exports.authenticationMiddleware = authenticationMiddleware
