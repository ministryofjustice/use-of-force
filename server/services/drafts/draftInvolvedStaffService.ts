import type { PrisonClient, AuthClient, RestClientBuilder, DraftReportClient } from '../../data'
import type { StaffDetails } from '../../data/draftReportClientTypes'
import type UserService from '../userService'

export type DraftInvolvedStaff = StaffDetails & { isReporter?: true }
export type DraftInvolvedStaffWithPrison = DraftInvolvedStaff & { prison?: string }

export class DraftInvolvedStaffService {
  constructor(
    private readonly authClientBuilder: RestClientBuilder<AuthClient>,
    private readonly prisonClientBuilder: RestClientBuilder<PrisonClient>,
    private readonly draftReportClient: DraftReportClient,
    private readonly userService: UserService
  ) {}

  private async reporter(token: string, reporterUsername: string): Promise<DraftInvolvedStaff> {
    const user = await this.userService.getUser(token, reporterUsername)
    if (!user.exists) {
      throw new Error(`cannot load reporter user: ${reporterUsername}`)
    }
    return user
  }

  public async getInvolvedStaff(token: string, username: string, bookingId: number): Promise<DraftInvolvedStaff[]> {
    const retrievedStaff = await this.draftReportClient.getInvolvedStaff(username, bookingId)
    const user = await this.reporter(token, username)
    return [{ ...user, isReporter: true }, ...retrievedStaff]
  }

  public async getInvolvedStaffWithPrisons(
    token: string,
    username: string,
    bookingId: number
  ): Promise<DraftInvolvedStaffWithPrison[]> {
    const prisonClient = this.prisonClientBuilder(token)
    const authClient = this.authClientBuilder(token)

    const [involvedStaff, prisons] = await Promise.all([
      this.getInvolvedStaff(token, username, bookingId),
      prisonClient.getPrisons(),
    ])

    const users = await authClient.getUsers(involvedStaff.map(staff => staff.username))

    const prisonForStaff = (staff: StaffDetails) => {
      const caseLoad = users.find(u => u.staffId === staff.staffId)?.activeCaseLoadId
      return prisons.find(p => p.agencyId === caseLoad)?.description
    }

    return involvedStaff.map(staff => ({ ...staff, prison: prisonForStaff(staff) }))
  }
}
