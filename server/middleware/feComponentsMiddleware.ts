import type { RequestHandler } from 'express'
import logger from '../../log'

export default function getFrontendComponents(feComponentsService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { header, footer } = await feComponentsService.getFeComponents(['header', 'footer'], res.locals.user.token)
      res.locals.feComponents = {
        header: header.html,
        footer: footer.html,
        cssIncludes: [...header.css, ...footer.css],
        jsIncludes: [...header.javascript, ...footer.javascript],
      }
      return next()
    } catch (error) {
      logger.error(error, 'Failed to retrieve front end components')
      return next()
    }
  }
}
