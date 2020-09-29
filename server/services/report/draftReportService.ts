import type DraftReportClient from '../../data/draftReportClient'
import type SubmitDraftReportService from './submitDraftReportService'
import type { LoggedInUser, SystemToken } from '../../types/uof'
import { check as getReportStatus } from './reportStatusChecker'
import UpdateDraftReportService from './updateDraftReportService'
import { DraftReport, NoDraftReport, StaffDetails } from '../../data/draftReportClientTypes'
import UserService from '../userService'

export type DraftInvolvedStaff = StaffDetails & { isReporter?: true }

export enum AddStaffResult {
  SUCCESS = 'success',
  SUCCESS_UNVERIFIED = 'unverified',
  MISSING = 'missing',
  ALREADY_EXISTS = 'already-exists',
}

export default class DraftReportService {
  constructor(
    private readonly draftReportClient: DraftReportClient,
    private readonly updateDraftReport: UpdateDraftReportService,
    private readonly submitDraftReport: SubmitDraftReportService,
    private readonly userService: UserService,
    private readonly systemToken: SystemToken
  ) {}

  public getCurrentDraft(userId: string, bookingId: number): Promise<DraftReport | NoDraftReport> {
    return this.draftReportClient.get(userId, bookingId)
  }

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

  public async addDraftStaff(user: LoggedInUser, bookingId: number, userToAdd: string): Promise<AddStaffResult> {
    const token = await this.systemToken(user.username)
    if (user.username === userToAdd) {
      return AddStaffResult.ALREADY_EXISTS
    }

    const users = await this.userService.getUsers(token, [userToAdd])
    if (!users.length) {
      return AddStaffResult.MISSING
    }
    const [newUser] = users

    const currentDraftStaff = await this.getInvolvedStaff(token, user.username, bookingId)

    const userAlreadyExists = currentDraftStaff.find(staff => staff.username === newUser.username)
    if (userAlreadyExists) {
      return AddStaffResult.ALREADY_EXISTS
    }

    const newInvolvedStaff = [...currentDraftStaff.filter(staff => !staff.isReporter), newUser]

    await this.process(user, bookingId, 'involvedStaff', newInvolvedStaff)

    return AddStaffResult.SUCCESS
  }

  public async deleteInvolvedStaff(user: LoggedInUser, bookingId: number, userToDelete: string): Promise<void> {
    const token = await this.systemToken(user.username)

    const currentDraftStaff = await this.getInvolvedStaff(token, user.username, bookingId)

    const newInvolvedStaff = currentDraftStaff.filter(staff => !staff.isReporter && staff.username !== userToDelete)

    await this.process(user, bookingId, 'involvedStaff', newInvolvedStaff)
  }

  public async markInvolvedStaffComplete(user: LoggedInUser, bookingId: number): Promise<void> {
    const { form = {} } = await this.draftReportClient.get(user.username, bookingId)

    if (form.involvedStaff) {
      return
    }

    /*
     * TODO: completeness will need to be tracked as a separate field.
     * involved staff should only be complete when a user explicitly say so.
     * At the moment we consider complete once any staff have been added or if they say no once.
     */
    await this.process(user, bookingId, 'involvedStaff', [])
  }

  public async isDraftComplete(username: string, bookingId: number): Promise<boolean> {
    const { form = {} } = await this.getCurrentDraft(username, bookingId)
    const { complete } = getReportStatus(form)
    return complete
  }

  getReportStatus(report) {
    return getReportStatus(report)
  }

  public process(
    currentUser: LoggedInUser,
    bookingId: number,
    formName: string,
    updatedSection: unknown,
    incidentDate?: Date | null
  ): Promise<void> {
    return this.updateDraftReport.process(currentUser, bookingId, formName, updatedSection, incidentDate)
  }

  public updateAgencyId(agencyId: string, username: string, bookingId: number): Promise<void> {
    return this.updateDraftReport.updateAgencyId(agencyId, username, bookingId)
  }

  public async submit(currentUser: LoggedInUser, bookingId: number): Promise<number | false> {
    const involvedStaff = await this.getInvolvedStaff(
      await this.systemToken(currentUser.username),
      currentUser.username,
      bookingId
    )
    return this.submitDraftReport.submit(currentUser, bookingId, involvedStaff)
  }
}
