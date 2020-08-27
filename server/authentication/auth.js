const passport = require('passport')
const { Strategy } = require('passport-oauth2')
const querystring = require('querystring')
const config = require('../config')
const { generateOauthClientToken } = require('./clientCredentials')

function authenticationMiddlewareFactory(tokenVerifier) {
  return async (req, res, next) => {
    if (req.isAuthenticated() && (await tokenVerifier.verify(res.locals.user.token))) {
      return next()
    }
    req.logout()
    const query = querystring.stringify({ returnTo: req.originalUrl })
    return res.redirect(`/login?${query}`)
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

function initialisePassportStrategy(signInService) {
  const strategy = new Strategy(
    {
      authorizationURL: `${config.apis.oauth2.externalUrl}/oauth/authorize`,
      tokenURL: `${config.apis.oauth2.url}/oauth/token`,
      clientID: config.apis.oauth2.apiClientId,
      clientSecret: config.apis.oauth2.apiClientSecret,
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

module.exports = {
  initialisePassportStrategy,
  authenticationMiddlewareFactory,
}
