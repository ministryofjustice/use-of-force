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
      // The components response is the source of truth for the active caseload, so it is always copied to
      // the session, including when the user no longer has one. This picks up a prison switch elsewhere in
      // DPS or a caseload removed in NOMIS. The session value is only kept when meta is missing or the call fails.
      if (meta) {
        req.session.activeCaseLoadId = meta.activeCaseLoad?.caseLoadId
      }
      return next()
    } catch (error) {
      logger.error(error, 'Failed to retrieve front end components')
      return next()
    }
  }
}
