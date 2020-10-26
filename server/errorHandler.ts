import { NextFunction, Request, Response } from 'express'
import { HttpError } from 'http-errors'
import logger from '../log'

export default function ErrorHandlerFactory(production: boolean) {
  return (error: HttpError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(error)

    res.locals.message = production
      ? 'Something went wrong. The error has been logged. Please try again'
      : error.message
    res.locals.status = error.status
    res.locals.stack = production ? null : error.stack

    res.status(error.status || 500)

    res.render('pages/error')
  }
}
