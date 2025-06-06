import moment, { Moment } from 'moment'
import type { DraftReportClient } from '../../data'
import type SubmitDraftReportService from './submitDraftReportService'
import type { FoundUserResult, LoggedInUser } from '../../types/uof'
import type UserService from '../userService'
import type { DraftReport, NoDraftReport, DuplicateReport } from '../../data/draftReportClientTypes'
import { check as getReportStatus, isReportComplete } from './reportStatusChecker'
import UpdateDraftReportService from './updateDraftReportService'
import LocationService from '../locationService'

import {
  DraftInvolvedStaffService,
  DraftInvolvedStaff,
  DraftInvolvedStaffWithPrison,
} from './draftInvolvedStaffService'
import AuthService from '../authService'

const REASONS_FOR_USE_OF_FORCE_FORM = 'reasonsForUseOfForce'

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
    private readonly locationService: LocationService,
    private readonly authService: AuthService
  ) {}

  public getCurrentDraft(userId: string, bookingId: number): Promise<DraftReport | NoDraftReport> {
    return this.draftReportClient.get(userId, bookingId)
  }

  public getInvolvedStaff(token: string, username: string, bookingId: number): Promise<DraftInvolvedStaff[]> {
    return this.draftInvolvedStaffService.getInvolvedStaff(token, username, bookingId)
  }

  public async getUoFReasonState(
    userId: string,
    bookingId: number
  ): Promise<{ isComplete: boolean; primaryReason?: string; reasons: string[] }> {
    const { form } = await this.getCurrentDraft(userId, bookingId)
    const reasonForm = form?.[REASONS_FOR_USE_OF_FORCE_FORM]
    const isComplete = isReportComplete(form || {})
    return { isComplete, reasons: reasonForm?.reasons || [], primaryReason: reasonForm?.primaryReason }
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
    const token = await this.authService.getSystemClientToken(user.username)
    const users = await this.userService.findUsers(token, firstName, lastName)
    return this.handleAddStaff(token, user, bookingId, users)
  }

  public async addDraftStaffByUsername(
    user: LoggedInUser,
    bookingId: number,
    username: string
  ): Promise<AddStaffResult> {
    const token = await this.authService.getSystemClientToken(user.username)
    const userToAdd = await this.userService.getUser(token, username)
    return this.handleAddStaff(token, user, bookingId, [userToAdd])
  }

  async getPotentialDuplicates(
    bookingId: number,
    incidentDate: Moment,
    token: string
  ): Promise<Partial<DuplicateReport[] | []>> {
    const startDate = moment(incidentDate).startOf('day')
    const endDate = moment(incidentDate).endOf('day')
    const reports = await this.draftReportClient.getDuplicateReports(bookingId, [startDate, endDate])
    return Promise.all(
      reports.map(async r => {
        const location = await this.locationService.getLocation(token, r.incidentLocationId)
        return {
          reporter: r.reporter,
          date: moment(r.date),
          location,
        }
      })
    )
  }

  public deleteReport(userId: string, bookingId: number): Promise<void> {
    return this.draftReportClient.deleteReport(userId, bookingId)
  }

  public async deleteInvolvedStaff(user: LoggedInUser, bookingId: number, userToDelete: string): Promise<void> {
    const token = await this.authService.getSystemClientToken(user.username)

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

  public async updateLocationId(reportId, incidentDateValue, formValue) {
    await this.updateDraftReport.updateLocationId(reportId, incidentDateValue, formValue)
  }

  public async submit(currentUser: LoggedInUser, bookingId: number): Promise<number | false> {
    const involvedStaff = await this.getInvolvedStaff(
      await this.authService.getSystemClientToken(currentUser.username),
      currentUser.username,
      bookingId
    )
    return this.submitDraftReport.submit(currentUser, bookingId, involvedStaff)
  }
}
