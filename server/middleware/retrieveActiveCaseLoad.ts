import type { RequestHandler } from 'express'
import logger from '../../log'
import type UserService from '../services/userService'

// Sets res.locals.user.activeCaseLoadId from the session. The session value is refreshed from the
// front end components response on each page (see feComponentsMiddleware). Manage Users is only
// asked when the session has no value, for example when the components call failed at sign-in.
export default function retrieveActiveCaseLoad(userService: UserService): RequestHandler {
  return async (req, res, next) => {
    const { user } = res.locals
    if (!user) {
      return next()
    }

    if (!req.session.activeCaseLoadId && user.authSource === 'nomis') {
      try {
        req.session.activeCaseLoadId = await userService.getActiveCaseLoadId(user.token)
      } catch (error) {
        logger.error(error, `Failed to retrieve active caseload for: ${user.username}`)
      }
    }

    user.activeCaseLoadId = req.session.activeCaseLoadId
    return next()
  }
}
