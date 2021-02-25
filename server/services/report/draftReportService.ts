import type DraftReportClient from '../../data/draftReportClient'
import type SubmitDraftReportService from './submitDraftReportService'
import type { FoundUserResult, LoggedInUser, SystemToken } from '../../types/uof'
import { check as getReportStatus } from './reportStatusChecker'
import UpdateDraftReportService from './updateDraftReportService'
import { DraftReport, NoDraftReport } from '../../data/draftReportClientTypes'
import UserService from '../userService'

import {
  DraftInvolvedStaffService,
  DraftInvolvedStaff,
  DraftInvolvedStaffWithPrison,
} from './draftInvolvedStaffService'

export enum AddStaffResult {
  SUCCESS = 'success',
  SUCCESS_UNVERIFIED = 'unverified',
  MISSING = 'missing',
  ALREADY_EXISTS = 'already-exists',
  NO_EXACT_MATCH = 'no-exact-match',
}

export default class DraftReportService {
  constructor(
    private readonly draftReportClient: DraftReportClient,
    private readonly draftInvolvedStaffService: DraftInvolvedStaffService,
    private readonly updateDraftReport: UpdateDraftReportService,
    private readonly submitDraftReport: SubmitDraftReportService,
    private readonly userService: UserService,
    private readonly systemToken: SystemToken
  ) {}

  public getCurrentDraft(userId: string, bookingId: number): Promise<DraftReport | NoDraftReport> {
    return this.draftReportClient.get(userId, bookingId)
  }

  public getInvolvedStaff(token: string, username: string, bookingId: number): Promise<DraftInvolvedStaff[]> {
    return this.draftInvolvedStaffService.getInvolvedStaff(token, username, bookingId)
  }

  public async getInvolvedStaffWithPrisons(
    token: string,
    username: string,
    bookingId: number
  ): Promise<DraftInvolvedStaffWithPrison[]> {
    return this.draftInvolvedStaffService.getInvolvedStaffWithPrisons(token, username, bookingId)
  }

  public async findUsers(
    token: string,
    agencyId: string,
    firstName: string,
    lastName: string
  ): Promise<FoundUserResult[]> {
    return this.userService.findUsersWithPrisons(token, agencyId, firstName, lastName)
  }

  private async handleAddStaff(
    token: string,
    user: LoggedInUser,
    bookingId: number,
    foundUsers: FoundUserResult[]
  ): Promise<AddStaffResult> {
    const currentDraftStaff = await this.getInvolvedStaff(token, user.username, bookingId)

    const users = foundUsers.filter(fu => !currentDraftStaff.some(cu => fu.username === cu.username))

    if (!users.length) {
      // if we have found users but no users after removing current users, then at least one user with that name has previously been added
      return foundUsers.length ? AddStaffResult.ALREADY_EXISTS : AddStaffResult.MISSING
    }
    if (users.length > 1) {
      return AddStaffResult.NO_EXACT_MATCH
    }
    const [newUser] = users

    const userAlreadyExists = currentDraftStaff.find(staff => staff.username === newUser.username)
    if (userAlreadyExists) {
      return AddStaffResult.ALREADY_EXISTS
    }

    const newInvolvedStaff = [...currentDraftStaff.filter(staff => !staff.isReporter), newUser]

    await this.process(user, bookingId, 'involvedStaff', newInvolvedStaff)

    return AddStaffResult.SUCCESS
  }

  public async addDraftStaffByName(
    user: LoggedInUser,
    bookingId: number,
    firstName: string,
    lastName: string
  ): Promise<AddStaffResult> {
    const token = await this.systemToken(user.username)
    const users = await this.userService.findUsers(token, firstName, lastName)
    return this.handleAddStaff(token, user, bookingId, users)
  }

  public async addDraftStaffByUsername(
    user: LoggedInUser,
    bookingId: number,
    username: string
  ): Promise<AddStaffResult> {
    const token = await this.systemToken(user.username)
    const users = await this.userService.getUsers(token, [username])
    return this.handleAddStaff(token, user, bookingId, users)
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
