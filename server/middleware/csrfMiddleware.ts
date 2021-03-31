import { RequestHandler } from 'express'

export default function csrf(): RequestHandler {
  return (req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  }
}
