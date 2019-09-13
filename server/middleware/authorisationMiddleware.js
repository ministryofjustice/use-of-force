const jwtDecode = require('jwt-decode')

module.exports = (req, res, next) => {
  if (res.locals && res.locals.user && res.locals.user.token) {
    const roles = jwtDecode(res.locals.user.token).authorities
    res.locals.user = { isReviewer: roles.includes('ROLE_USE_OF_FORCE_REVIEWER'), ...res.locals.user }
    return next()
  }
  req.session.returnTo = req.originalUrl
  return res.redirect('/login')
}
