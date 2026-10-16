/* eslint-disable @typescript-eslint/no-explicit-any */
import { UUID } from 'crypto'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    systemToken: string
    incidentReport: Record<string, any>[]
    flash: Record<string, any[]>
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
    }

    interface Request {
      id: string
      logout: () => void
      csrfToken: () => string
      flash(): { [key: string]: any[] }
      flash(type: string, message: any): number
      flash(message: string): any[]
    }

    interface Response {
      locals: {
        user?: {
          username: string
          token: string
          firstName: string
          lastName: string
          userId: string | undefined // This is an id specific to the authSource, for example for NOMIS users this is the staffId
          userUuid: UUID | undefined // This is a UUID created by HMPPS Auth upon first user login that is unique to the user across all authSources
          authSource: string | undefined
          displayName: string
          isReviewer: boolean
          isCoordinator: boolean
          activeCaseLoadId: string
        }
      }
    }
  }
}
