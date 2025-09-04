/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace Express {
  export interface Request {
    id: string
    user?: {
      username: string
      token: string
    }
    session: any
    logout: () => void
    csrfToken: () => string
    flash(): { [key: string]: any[] }
    flash(type: string, message: any): number
    flash(message: string): any[]
  }
  export interface Response {
    locals: {
      user?: {
        username: string
        token: string
        firstName: string
        lastName: string
        userId: string
        displayName: string
        isReviewer: boolean
        isCoordinator: boolean
        activeCaseLoadId: string
      }
    }
  }
}
