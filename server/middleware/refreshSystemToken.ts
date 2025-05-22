import { Router } from 'express'
import { jwtDecode } from 'jwt-decode'
import logger from '../../log'
import { Services } from '../services'

export default function refreshSystemToken({ authService }: Services): Router {
  const router = Router({ mergeParams: true })

  router.use(async (req, res, next) => {
    if (req.session.systemToken) {
      const decodedToken = jwtDecode(req.session.systemToken)
      if (decodedToken.exp - Date.now() / 1000 > 60) {
        next()
        return
      }
    }

    try {
      req.session.systemToken = await authService.getSystemClientToken(res.locals.user?.username)

      next()
    } catch (error) {
      logger.error(error, `Failed to refresh system token for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  })

  return router
}
