import { NextFunction, Request, Response } from 'express'
import { jwtDecode } from 'jwt-decode'
import { UUID } from 'crypto'
import logger from '../../log'
import { nameCase } from '../utils/utils'

type TokenClaims = {
  name?: string
  user_id?: string
  user_uuid?: UUID
  auth_source?: string
}

const decodeTokenClaims = (token: string): TokenClaims => {
  try {
    return jwtDecode<TokenClaims>(token)
  } catch {
    return {}
  }
}

// The user's details come from the HMPPS Auth token, so no API call is needed on each request.
// The active caseload is added later by setUserActiveCaseLoadId.
export default () =>
  (req: Request, res: Response, next: NextFunction): void => {
    res.locals = {
      ...res.locals,
      currentUrlPath: req.baseUrl + req.path,
      hostname: req.hostname,
    }

    if (res.locals.user) {
      const {
        name,
        user_id: userId,
        user_uuid: userUuid,
        auth_source: authSource,
      } = decodeTokenClaims(res.locals.user.token)
      res.locals.user = { displayName: nameCase(name), userId, userUuid, authSource, ...res.locals.user }
    } else {
      logger.info('No user available')
    }
    next()
  }
