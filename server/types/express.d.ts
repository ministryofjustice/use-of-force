declare namespace Express {
  export interface Request {
    user?: {
      username: string
      token: string
      refreshToken: string
      refreshTime: any
    }
    session: any
    logout: () => void
    csrfToken: () => string
    flash: any
  }
  export interface Response {
    locals: {
      user?: {
        username: string
        token: string
        refreshToken: string
        refreshTime: number
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
