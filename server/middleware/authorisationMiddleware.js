const jwtDecode = require('jwt-decode')

const COORDINATOR = 'ROLE_USE_OF_FORCE_COORDINATOR'
const REVIEWER = 'ROLE_USE_OF_FORCE_REVIEWER'

module.exports = (req, res, next) => {
  if (res.locals && res.locals.user && res.locals.user.token) {
    const { authorities: roles = [] } = jwtDecode(res.locals.user.token)

    const isAnyOf = options => options.some(role => roles.includes(role))

    res.locals.user = {
      isReviewer: isAnyOf([REVIEWER, COORDINATOR]),
      isCoordinator: isAnyOf([COORDINATOR]),
      ...res.locals.user,
    }
    return next()
  }
  req.session.returnTo = req.originalUrl
  return res.redirect('/login')
}
