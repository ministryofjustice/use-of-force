import createError from 'http-errors'

const check = userCheck => (req, res, next) => {
  if (userCheck(res.locals.user)) {
    return next()
  }
  throw createError(401, 'Not authorised to access this resource')
}

export default {
  coordinatorOnly: check(user => user.isCoordinator),
  reviewerOrCoordinatorOnly: check(user => user.isCoordinator || user.isReviewer),
  adminOnly: check(user => user.isAdmin),
}
