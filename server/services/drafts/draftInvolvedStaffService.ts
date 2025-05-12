import { PrisonClient, DraftReportClient, ManageUsersApiClient } from '../../data'
import type { StaffDetails } from '../../data/draftReportClientTypes'
import type UserService from '../userService'

export type DraftInvolvedStaff = StaffDetails & { isReporter?: true }
export type DraftInvolvedStaffWithPrison = DraftInvolvedStaff & { prison?: string }

export class DraftInvolvedStaffService {
  constructor(
    private readonly manageUsersApiClient: ManageUsersApiClient,
    private readonly prisonClient: PrisonClient,
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

  public async getInvolvedStaff(token: string, username: string, bookingId: string): Promise<DraftInvolvedStaff[]> {
    const retrievedStaff = await this.draftReportClient.getInvolvedStaff(username, bookingId)
    const user = await this.reporter(token, username)
    return [{ ...user, isReporter: true }, ...retrievedStaff]
  }

  public async getInvolvedStaffWithPrisons(
    token: string,
    username: string,
    bookingId: string
  ): Promise<DraftInvolvedStaffWithPrison[]> {
    const [involvedStaff, prisons] = await Promise.all([
      this.getInvolvedStaff(token, username, bookingId),
      this.prisonClient.getPrisons(token),
    ])

    const users = await this.manageUsersApiClient.getUsers(
      involvedStaff.map(staff => staff.username),
      token
    )

    const prisonForStaff = (staff: StaffDetails) => {
      const caseLoad = users.find(u => u.staffId === staff.staffId)?.activeCaseLoadId
      return prisons.find(p => p.agencyId === caseLoad)?.description
    }

    return involvedStaff.map(staff => ({ ...staff, prison: prisonForStaff(staff) }))
  }
}
