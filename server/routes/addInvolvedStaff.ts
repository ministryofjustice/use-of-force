import { Response, Request } from 'express'
import { properCaseFullName } from '../utils/utils'

import { nextPaths } from '../config/incident'
import { SystemToken } from '../types/uof'
import DraftReportService, { AddStaffResult } from '../services/report/draftReportService'

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
    return res.render('formPages/addingStaff/staff-involved', { staff, bookingId, errors })
  }

  public async submitStaffInvolved(req: Request, res: Response): Promise<void> {
    const { bookingId } = req.params
    const { addMore } = req.body

    if (!addMore) {
      req.flash('errors', [
        {
          text: 'Select yes if you want to add another member of staff',
          href: '#confirm',
        },
      ])
      return res.redirect(`/report/${bookingId}/staff-involved`)
    }

    if (addMore === 'yes') {
      return res.redirect(`/report/${bookingId}/staff-member-name`)
    }
    return res.redirect(nextPaths.involvedStaff(bookingId))
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
      return res.redirect(`/report/${bookingId}/delete-staff-member/${username}`)
    }

    if (confirm === 'yes') {
      await this.draftReportService.deleteInvolvedStaff(res.locals.user, parseInt(bookingId, 10), username)
    }

    return res.redirect(`/report/${bookingId}/staff-involved`)
  }

  public async viewStaffMemberName(req: Request, res: Response): Promise<void> {
    const errors = req.flash('errors')
    return res.render('formPages/addingStaff/staff-member-name', { errors })
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
      return res.redirect(`/report/${bookingId}/staff-member-name`)
    }

    const result = await this.draftReportService.addDraftStaff(res.locals.user, parseInt(bookingId, 10), username)

    switch (result) {
      case AddStaffResult.MISSING: {
        req.flash('query', { username })
        return res.redirect(`/report/${bookingId}/staff-member-not-found`)
      }
      case AddStaffResult.ALREADY_EXISTS:
      case AddStaffResult.SUCCESS:
      case AddStaffResult.SUCCESS_UNVERIFIED: {
        return res.redirect(`/report/${bookingId}/staff-involved`)
      }
      default:
        throw new Error(`Unexpected result: ${result}`)
    }
  }

  public async viewStaffMemberNotFound(req: Request, res: Response): Promise<void> {
    const { bookingId } = req.params
    const query = getFromFlash(req, 'query')
    if (!query) {
      return res.redirect(`/report/${bookingId}/staff-involved`)
    }
    const name = query.username
    return res.render('formPages/addingStaff/staff-member-not-found', { name, bookingId })
  }
}
