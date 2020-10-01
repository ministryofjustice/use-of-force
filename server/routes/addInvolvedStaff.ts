import { Response, Request } from 'express'

import { paths, nextPaths } from '../config/incident'
import { SystemToken } from '../types/uof'
import DraftReportService, { AddStaffResult } from '../services/report/draftReportService'

const SubmitType = {
  SAVE_AND_CONTINUE: 'save-and-continue',
  SAVE_AND_RETURN: 'save-and-return',
}

const getFromFlash = (req, name) => {
  const result = req.flash(name)
  return result.length !== 0 ? result[0] : null
}

export default class AddInvolvedStaffRoutes {
  constructor(private readonly draftReportService: DraftReportService, private readonly systemToken: SystemToken) {}

  public viewStaffInvolved = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const errors = req.flash('errors')
    const staff = await this.draftReportService.getInvolvedStaff(
      await this.systemToken(req.user.username),
      req.user.username,
      parseInt(bookingId, 10)
    )
    const complete = await this.draftReportService.isDraftComplete(req.user.username, parseInt(bookingId, 10))
    return res.render('formPages/addingStaff/staff-involved', {
      staff,
      errors,
      editMode: complete,
      data: { staff, bookingId },
    })
  }

  public submitStaffInvolved = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const { addMore, submitType } = req.body

    if (addMore === 'no') {
      await this.draftReportService.markInvolvedStaffComplete(res.locals.user, parseInt(bookingId, 10))
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
    const complete = await this.draftReportService.isDraftComplete(req.user.username, parseInt(bookingId, 10))
    const destination = complete ? paths.checkYourAnswers(bookingId) : nextPaths.involvedStaff(bookingId)
    return res.redirect(destination)
  }

  public async viewDeleteStaffMember(req: Request, res: Response): Promise<void> {
    const { bookingId, username } = req.params
    const errors = req.flash('errors')
    return res.render('formPages/addingStaff/delete-staff-member', { bookingId, username, errors })
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
      await this.draftReportService.deleteInvolvedStaff(res.locals.user, parseInt(bookingId, 10), username)
    }

    return res.redirect(paths.staffInvolved(bookingId))
  }

  public async viewStaffMemberName(req: Request, res: Response): Promise<void> {
    const { bookingId } = req.params
    const errors = req.flash('errors')
    return res.render('formPages/addingStaff/staff-member-name', { errors, bookingId })
  }

  public submitStaffMemberName = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const { username } = req.body

    if (!username?.trim()) {
      req.flash('errors', [
        {
          text: 'Enter a staff member’s username',
          href: '#username',
        },
      ])
      return res.redirect(paths.staffMemberName(bookingId))
    }

    const result = await this.draftReportService.addDraftStaff(res.locals.user, parseInt(bookingId, 10), username)

    switch (result) {
      case AddStaffResult.MISSING: {
        req.flash('query', { username })
        return res.redirect(paths.staffNotFound(bookingId))
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
    const name = query.username
    return res.render('formPages/addingStaff/staff-member-not-found', { name, bookingId })
  }
}
