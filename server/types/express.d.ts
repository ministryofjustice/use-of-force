declare namespace Express {
  export interface Request {
    user?: {
      username: string
      token: string
      refreshToken: string
      refreshTime: any
      firstName: string
      lastName: string
      userId: string
      displayName: string
      isReviewer: boolean
      isCoordinator: boolean
      activeCaseLoadId: string
    }
    session: any
    logout: () => void
    csrfToken: () => string
    flash: any
  }
}
