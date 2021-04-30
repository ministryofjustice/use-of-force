const httpError = require('http-errors')

const check = userCheck => (req, res, next) => {
  if (userCheck(res.locals.user)) {
    return next()
  }
  throw httpError(401, 'Not authorised to access this resource')
}

module.exports = {
  coordinatorOnly: check(user => user.isCoordinator),
  reviewerOrCoordinatorOnly: check(user => user.isCoordinator || user.isReviewer),
  adminOnly: check(user => user.isAdmin),
}
