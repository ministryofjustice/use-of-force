import bunyan, { LoggerOptions } from 'bunyan'
import type { RequestHandler } from 'express'

export default function createRequestLogger(settings: LoggerOptions): RequestHandler {
  const log = bunyan.createLogger(settings)

  return function requestLogger(req, res, next) {
    log.info({ req })

    res.on('finish', function onFinish() {
      log.info({ res })
    })

    next()
  }
}
