import type DraftReportClient from '../../data/draftReportClient'
import { StaffDetails } from '../../data/draftReportClientTypes'
import UserService from '../userService'
import { Elite2ClientBuilder } from '../../data/elite2ClientBuilder'
import { AuthClientBuilder } from '../../data/authClientBuilder'

export type DraftInvolvedStaff = StaffDetails & { isReporter?: true }
export type DraftInvolvedStaffWithPrison = DraftInvolvedStaff & { prison?: string }

export class DraftInvolvedStaffService {
  constructor(
    private readonly authClientBuilder: AuthClientBuilder,
    private readonly elite2ClientBuilder: Elite2ClientBuilder,
    private readonly draftReportClient: DraftReportClient,
    private readonly userService: UserService
  ) {}

  private async reporter(token: string, reporterUsername: string): Promise<DraftInvolvedStaff> {
    const users = await this.userService.getUsers(token, [reporterUsername])
    if (!users.length) {
      throw new Error(`cannot load reporter user: ${reporterUsername}`)
    }
    const [user] = users
    return { ...user, isReporter: true }
  }

  /**
   * With the add to list pattern, a user will no longer be able to explicitly add themselves as involved staff.
   * So we could just always add the user here. Unfortunately current draft reports could theoretically have added users.
   * TODO: Add a migration to remove the current user if present on reports? Or check if even necessary?
   */
  public async getInvolvedStaff(token: string, username: string, bookingId: number): Promise<DraftInvolvedStaff[]> {
    const retrievedStaff = await this.draftReportClient.getInvolvedStaff(username, bookingId)
    const staffWithoutReporter = retrievedStaff.filter(staff => staff.username !== username)
    return [await this.reporter(token, username), ...staffWithoutReporter]
  }

  public async getInvolvedStaffWithPrisons(
    token: string,
    username: string,
    bookingId: number
  ): Promise<DraftInvolvedStaffWithPrison[]> {
    const elite2Client = this.elite2ClientBuilder(token)
    const authClient = this.authClientBuilder(token)

    const [involvedStaff, prisons] = await Promise.all([
      this.getInvolvedStaff(token, username, bookingId),
      elite2Client.getPrisons(),
    ])

    const users = await authClient.getUsers(involvedStaff.map(staff => staff.username))

    const prisonForStaff = (staff: StaffDetails) => {
      const caseLoad = users.find(u => u.staffId === staff.staffId)?.activeCaseLoadId
      return prisons.find(p => p.agencyId === caseLoad)?.description
    }

    return involvedStaff.map(staff => ({ ...staff, prison: prisonForStaff(staff) }))
  }
}
