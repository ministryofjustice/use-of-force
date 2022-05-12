import { Error } from '../types/uof'

function unauthorisedError() {
  /** @type {any} */
  const error: Error = new Error('Unauthorised access')
  error.status = 401
  return error
}

function forbiddenError() {
  /** @type {any} */
  const error: Error = new Error('Forbidden access')
  error.status = 403
  return error
}

export { forbiddenError, unauthorisedError }
