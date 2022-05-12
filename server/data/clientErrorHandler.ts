import R from 'ramda'
import logger from '../../log'
import { unauthorisedError, forbiddenError } from '../utils/errors'

interface ClientError extends Error {
  message: string
  stack?: any
}

export interface RequestError extends ClientError {
  message: string
  stack?: any
  request: any
  code: number
}

export interface ResponseError extends ClientError {
  message: string
  stack?: any
  request: any
  code: number
  response: {
    status: number
  }
}

// HTTP status code 404 - Not Found
const NOT_FOUND = 404
const UNAUTHORISED = 401
const FORBIDDEN = 403

const isRequestError = (error: Error): error is RequestError => (error as RequestError).request

const isResponseError = (error: Error): error is ResponseError =>
  R.hasPath(['response', 'status'], error as ResponseError)

/**
 * Build a function that logs information from a ClientError object, then if NOT_FOUND returns undefined, otherwise
 * logs the error excluding sensitive information and throws a new Error containing the original Error's message (only)
 * @param apiName A friendly name for the API that will be included in log statements.
 */
// eslint-disable-next-line import/prefer-default-export
export const buildErrorHandler = (apiName: string) => {
  return (error: ClientError, path: string, verb = 'GET'): undefined => {
    if (isResponseError(error)) {
      if (error.response.status === NOT_FOUND) {
        logger.info(`Not Found (404) calling ${apiName}, path: '${path}', verb: '${verb}'`, error.stack)
        return undefined
      }

      logger.warn(
        `Error calling ${apiName}, path: '${path}', verb: '${verb}', status: '${error.response.status}'`,
        error.stack
      )
      if (error.response.status === UNAUTHORISED) {
        throw unauthorisedError()
      } else if (error.response.status === FORBIDDEN) {
        throw forbiddenError()
      }
    } else if (isRequestError(error)) {
      logger.warn(`Error calling ${apiName}, path: '${path}', verb: '${verb}', code: '${error.code}'`, error.stack)
    } else {
      logger.warn(`Error calling ${apiName}, path: '${path}', verb: '${verb}'`, error.stack)
    }
    throw Error(error.message)
  }
}
