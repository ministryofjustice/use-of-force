import { NextFunction, Request, Response } from 'express'
import jwtDecode from 'jwt-decode'

export const COORDINATOR = 'ROLE_USE_OF_FORCE_COORDINATOR'
export const REVIEWER = 'ROLE_USE_OF_FORCE_REVIEWER'
export const ADMIN = 'ROLE_NOMIS_BATCHLOAD'

export default (req: Request, res: Response, next: NextFunction): void => {
  if (res.locals && res.locals.user && res.locals.user.token) {
    const { authorities: roles = [] } = jwtDecode<Record<string, string[]>>(res.locals.user.token)

    const isAnyOf = (options: string[]) => options.some(role => roles.includes(role))

    res.locals.user = {
      isReviewer: isAnyOf([REVIEWER, COORDINATOR]),
      isCoordinator: isAnyOf([COORDINATOR]),
      isAdmin: isAnyOf([ADMIN]),
      ...res.locals.user,
    }
    return next()
  }
  req.session.returnTo = req.originalUrl
  return res.redirect('/login')
}
