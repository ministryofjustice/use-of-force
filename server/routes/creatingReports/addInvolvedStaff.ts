import { Request, Response } from 'express'

import { properCaseFullName } from '../../utils/utils'
import { nextPaths, paths } from '../../config/incident'
import DraftReportService, { AddStaffResult } from '../../services/drafts/draftReportService'
import AuthService from '../../services/authService'
import OffenderService from '../../services/offenderService'

const SubmitType = {
  SAVE_AND_CONTINUE: 'save-and-continue',
  SAVE_AND_RETURN: 'save-and-return',
}

const getFromFlash = (req, name) => {
  const result = req.flash(name)
  return result.length !== 0 ? result[0] : null
}

export default class AddInvolvedStaffRoutes {
  constructor(
    private readonly draftReportService: DraftReportService,
    private readonly authService: AuthService,
    private readonly offenderService: OffenderService
  ) {}

  public viewStaffInvolved = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const errors = req.flash('errors')
    const token = await this.authService.getSystemClientToken(req.user.username)
    const staff = await this.draftReportService.getInvolvedStaffWithPrisons(token, req.user.username, bookingId)
    const offenderDetail = await this.offenderService.getOffenderDetails(bookingId, req.user.username)

    const complete = await this.draftReportService.isDraftComplete(req.user.username, bookingId)
    return res.render('formPages/addingStaff/staff-involved', {
      staff,
      errors,
      editMode: complete,
      data: { staff, bookingId, offenderDetail },
    })
  }

  public submitStaffInvolved = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const { addMore, submitType } = req.body

    if (addMore === 'no') {
      await this.draftReportService.markInvolvedStaffComplete(res.locals.user, bookingId)
    }

    if (submitType === SubmitType.SAVE_AND_RETURN) {
      return res.redirect(paths.reportUseOfForce(bookingId))
    }

    if (!addMore) {
      req.flash('errors', [
        {
          text: 'Select yes if you want to add another member of staff',
          href: '#confirm',
        },
      ])
      return res.redirect(paths.staffInvolved(bookingId))
    }

    if (addMore === 'yes') {
      return res.redirect(paths.staffMemberName(bookingId))
    }
    const complete = await this.draftReportService.isDraftComplete(req.user.username, bookingId)
    const destination = complete ? paths.checkYourAnswers(bookingId) : nextPaths.involvedStaff(bookingId)
    return res.redirect(destination)
  }

  public viewDeleteStaffMember = async (req: Request, res: Response): Promise<void> => {
    const { bookingId, username } = req.params
    const errors = req.flash('errors')
    const involvedStaff = await this.draftReportService.getInvolvedStaff(
      await this.authService.getSystemClientToken(req.user.username),
      req.user.username,
      bookingId
    )
    const staffToDelete = involvedStaff.find(staff => staff.username === username)
    const name = properCaseFullName(staffToDelete.name)
    return res.render('formPages/addingStaff/delete-staff-member', { bookingId, username, name, errors })
  }

  public submitDeleteStaffMember = async (req: Request, res: Response): Promise<void> => {
    const { bookingId, username } = req.params
    const { confirm } = req.body

    if (!confirm) {
      req.flash('errors', [
        {
          text: 'Select yes if you want to delete this staff member',
          href: '#confirm',
        },
      ])
      return res.redirect(paths.deleteStaffMember(bookingId, username))
    }

    if (confirm === 'yes') {
      await this.draftReportService.deleteInvolvedStaff(res.locals.user, bookingId, username)
    }

    return res.redirect(paths.staffInvolved(bookingId))
  }

  public async viewStaffMemberName(req: Request, res: Response): Promise<void> {
    const { bookingId } = req.params
    const { firstName, lastName } = req.flash('userInput')?.[0] ?? {}
    const errors = req.flash('errors')
    return res.render('formPages/addingStaff/staff-member-name', { errors, firstName, lastName, bookingId })
  }

  public submitStaffMemberName = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const { firstName, lastName } = req.body

    const errors = []
    if (!firstName?.trim()) {
      errors.push({
        text: 'Enter a staff member’s first name',
        href: '#firstName',
      })
    }

    if (!lastName?.trim()) {
      errors.push({
        text: 'Enter a staff member’s last name',
        href: '#lastName',
      })
    }

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('userInput', { firstName, lastName })
      return res.redirect(paths.staffMemberName(bookingId))
    }

    const result = await this.draftReportService.addDraftStaffByName(res.locals.user, bookingId, firstName, lastName)

    switch (result) {
      case AddStaffResult.MISSING: {
        req.flash('query', { firstName, lastName })
        return res.redirect(paths.staffNotFound(bookingId))
      }
      case AddStaffResult.NO_EXACT_MATCH: {
        req.flash('query', { firstName, lastName })
        return res.redirect(paths.selectStaffMember(bookingId))
      }
      case AddStaffResult.ALREADY_EXISTS:
      case AddStaffResult.SUCCESS:
      case AddStaffResult.SUCCESS_UNVERIFIED: {
        return res.redirect(paths.staffInvolved(bookingId))
      }
      default:
        throw new Error(`Unexpected result: ${result}`)
    }
  }

  public async viewStaffMemberNotFound(req: Request, res: Response): Promise<void> {
    const { bookingId } = req.params
    const query = getFromFlash(req, 'query')
    if (!query) {
      return res.redirect(paths.staffInvolved(bookingId))
    }
    const { firstName, lastName } = query
    const name = properCaseFullName(`${firstName} ${lastName}`)
    return res.render('formPages/addingStaff/staff-member-not-found', { bookingId, name })
  }

  public viewSelectStaffMember = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const query = getFromFlash(req, 'query')
    if (!query) {
      return res.redirect(paths.staffInvolved(bookingId))
    }
    const { firstName, lastName } = query
    const { agencyId } = await this.draftReportService.getCurrentDraft(res.locals.user.username, bookingId)

    const staff = await this.draftReportService.findUsers(
      await this.authService.getSystemClientToken(req.user.username),
      agencyId,
      firstName,
      lastName
    )

    return res.render('formPages/addingStaff/select-staff-member', {
      bookingId,
      firstName,
      lastName,
      staff,
      errors: req.flash('errors'),
    })
  }

  public submitSelectStaffMember = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const { selectedStaffUsername, firstName, lastName } = req.body

    if (!selectedStaffUsername) {
      const errors = [
        {
          text: 'Select the staff member you want to add',
          href: '#user-1',
        },
      ]
      req.flash('query', { firstName, lastName })
      req.flash('errors', errors)
      return res.redirect(paths.selectStaffMember(bookingId))
    }

    const result = await this.draftReportService.addDraftStaffByUsername(
      res.locals.user,
      bookingId,
      selectedStaffUsername
    )

    switch (result) {
      case AddStaffResult.ALREADY_EXISTS:
      case AddStaffResult.SUCCESS:
      case AddStaffResult.SUCCESS_UNVERIFIED: {
        return res.redirect(paths.staffInvolved(bookingId))
      }
      default:
        throw new Error(`Unexpected result: ${result}`)
    }
  }
}
