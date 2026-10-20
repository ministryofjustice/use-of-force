import { NextFunction, Request, Response } from 'express'
import { jwtDecode } from 'jwt-decode'
import { UUID } from 'crypto'
import logger from '../../log'
import UserService from '../services/userService'

type TokenClaims = {
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

export default (userService: UserService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.locals = {
      ...res.locals,
      currentUrlPath: req.baseUrl + req.path,
      hostname: req.hostname,
    }
    try {
      const user = res.locals.user && (await userService.getSelf(res.locals.user.token))

      if (user) {
        const {
          user_id: userId,
          user_uuid: userUuid,
          auth_source: authSource,
        } = decodeTokenClaims(res.locals.user.token)
        res.locals.user = { ...user, userId, userUuid, authSource, ...res.locals.user }
      } else {
        logger.info('No user available')
      }
    } catch (error) {
      logger.error(error, `Failed to retrieve user for: ${res.locals.user}`)
    }
    next()
  }
