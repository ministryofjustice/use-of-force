import type { RequestHandler } from 'express'
import logger from '../../log'

export default function getFrontendComponents(feComponentsService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { header, footer, meta } = await feComponentsService.getFeComponents(
        ['header', 'footer'],
        res.locals.user.token,
      )
      res.locals.feComponents = {
        header: header.html,
        footer: footer.html,
        cssIncludes: [...header.css, ...footer.css],
        jsIncludes: [...header.javascript, ...footer.javascript],
      }
      // Keep the active caseload up to date in case the user has switched prison elsewhere in DPS
      if (meta?.activeCaseLoad?.caseLoadId) {
        req.session.activeCaseLoadId = meta.activeCaseLoad.caseLoadId
      }
      return next()
    } catch (error) {
      logger.error(error, 'Failed to retrieve front end components')
      return next()
    }
  }
}
