import request from 'supertest'
import { paths } from '../../config/incident'
import { StaffDetails } from '../../data/draftReportClientTypes'
import DraftReportService, { AddStaffResult } from '../../services/drafts/draftReportService'
import { appWithAllRoutes, user } from '../__test/appSetup'
import AuthService from '../../services/authService'
import OffenderService from '../../services/offenderService'

jest.mock('../../services/drafts/draftReportService')
jest.mock('../../services/authService')
jest.mock('../../services/offenderService')

const draftReportService = new DraftReportService(
  null,
  null,
  null,
  null,
  null,
  null,
  null
) as jest.Mocked<DraftReportService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>

const REPORT_ID = -19

let app
const flash = jest.fn()

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue('user1-system-token')
  app = appWithAllRoutes({ draftReportService, authService, offenderService }, undefined, false, flash)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('staff involved page', () => {
  test('GET should display content and current staff', () => {
    draftReportService.getInvolvedStaffWithPrisons.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    return request(app)
      .get(paths.staffInvolved(REPORT_ID))
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Staff involved in use of force')
        expect(res.text).toContain('User bob')
        expect(res.text).toContain('bob@justice.gov.uk')
        expect(draftReportService.getInvolvedStaffWithPrisons).toHaveBeenCalledWith(
          'user1-system-token',
          'user1',
          REPORT_ID
        )
      })
  })

  test('POST requires an option to be selected', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    return request(app)
      .post(paths.staffInvolved(REPORT_ID))
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffInvolved(REPORT_ID))
  })

  test('POST no more staff to add, triggers redirect', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    return request(app)
      .post(paths.staffInvolved(REPORT_ID))
      .send({ addMore: 'no' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.whyWasUofApplied(REPORT_ID))
      .expect(() => {
        expect(draftReportService.markInvolvedStaffComplete).toHaveBeenCalledWith(user, REPORT_ID)
      })
  })

  test('POST no more staff to add when save and returning marks complete', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    return request(app)
      .post(paths.staffInvolved(REPORT_ID))
      .send({ addMore: 'no', submitType: 'save-and-return' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.reportUseOfForce(REPORT_ID))
      .expect(() => {
        expect(draftReportService.markInvolvedStaffComplete).toHaveBeenCalledWith(user, REPORT_ID)
      })
  })

  test('POST no more staff to add when report is complete', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    draftReportService.isDraftComplete.mockResolvedValue(true)
    return request(app)
      .post(paths.staffInvolved(REPORT_ID))
      .send({ addMore: 'no', submitType: 'save-and-continue' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.checkYourAnswers(REPORT_ID))
      .expect(() => {
        expect(draftReportService.markInvolvedStaffComplete).toHaveBeenCalledWith(user, REPORT_ID)
      })
  })

  test('POST more staff to add, triggers redirect', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    return request(app)
      .post(paths.staffInvolved(REPORT_ID))
      .send({ addMore: 'yes' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffMemberName(REPORT_ID))
  })
})

describe('delete staff page', () => {
  test('GET should display content and staff to delete', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([{ username: 'USER-1', name: 'BOB SMITH' }])
    return request(app)
      .get(paths.deleteStaffMember(REPORT_ID, `USER-1`))
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Are you sure you want to delete Bob Smith?')
      })
  })

  test('POST requires confirmation option to be selected', () => {
    return request(app)
      .post(paths.deleteStaffMember(REPORT_ID, `USER-1`))
      .expect('Content-Type', /text\/plain/)
      .expect('Location', `/report/${REPORT_ID}/delete-staff-member/USER-1`)
  })

  test('POST selecting do not delete, triggers redirect', () => {
    return request(app)
      .post(paths.deleteStaffMember(REPORT_ID, `USER-1`))
      .send({ confirm: 'no' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffInvolved(REPORT_ID))
      .expect(() => {
        expect(draftReportService.deleteInvolvedStaff).not.toHaveBeenCalled()
      })
  })

  test('POST selecting do not delete, triggers redirect', () => {
    return request(app)
      .post(paths.deleteStaffMember(REPORT_ID, `USER-1`))
      .send({ confirm: 'yes' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffInvolved(REPORT_ID))
      .expect(() => {
        expect(draftReportService.deleteInvolvedStaff).toHaveBeenCalledWith(user, REPORT_ID, 'USER-1')
      })
  })
})

describe('submit staff', () => {
  test('GET should display title', () => {
    return request(app)
      .get(paths.staffMemberName(REPORT_ID))
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('What is the staff member&#39;s name?')
      })
  })

  test('POST requires name specifying. First and last names missing', () => {
    return request(app)
      .post(paths.staffMemberName(REPORT_ID))
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffMemberName(REPORT_ID))
  })

  test('POST requires name specifying. First name missing', () => {
    return request(app)
      .post(paths.staffMemberName(REPORT_ID))
      .send({ lastName: 'Jones' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffMemberName(REPORT_ID))
  })

  test('POST requires name specifying. Last name missing', () => {
    return request(app)
      .post(paths.staffMemberName(REPORT_ID))
      .send({ firstName: 'Jo' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffMemberName(REPORT_ID))
  })

  test('POST staff added successfully', () => {
    draftReportService.addDraftStaffByName.mockResolvedValue(AddStaffResult.SUCCESS)
    return request(app)
      .post(paths.staffMemberName(REPORT_ID))
      .send({ firstName: 'Jo', lastName: 'Jones' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffInvolved(REPORT_ID))
      .expect(() => {
        expect(draftReportService.addDraftStaffByName).toHaveBeenCalledWith(user, REPORT_ID, 'Jo', 'Jones')
      })
  })

  test('POST staff added when unverified', () => {
    draftReportService.addDraftStaffByName.mockResolvedValue(AddStaffResult.SUCCESS_UNVERIFIED)
    return request(app)
      .post(paths.staffMemberName(REPORT_ID))
      .send({ firstName: 'Jo', lastName: 'Jones' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffInvolved(REPORT_ID))
      .expect(() => {
        expect(draftReportService.addDraftStaffByName).toHaveBeenCalledWith(user, REPORT_ID, 'Jo', 'Jones')
      })
  })

  test('POST we do not handle when staff already added to report', () => {
    draftReportService.addDraftStaffByName.mockResolvedValue(AddStaffResult.ALREADY_EXISTS)
    return request(app)
      .post(paths.staffMemberName(REPORT_ID))
      .send({ firstName: 'Jo', lastName: 'Jones' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffInvolved(REPORT_ID))
      .expect(() => {
        expect(draftReportService.addDraftStaffByName).toHaveBeenCalledWith(user, REPORT_ID, 'Jo', 'Jones')
      })
  })

  test('POST staff not added as missing user', () => {
    draftReportService.addDraftStaffByName.mockResolvedValue(AddStaffResult.MISSING)
    return request(app)
      .post(paths.staffMemberName(REPORT_ID))
      .send({ firstName: 'Jo', lastName: 'Jones' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffNotFound(REPORT_ID))
      .expect(() => {
        expect(draftReportService.addDraftStaffByName).toHaveBeenCalledWith(user, REPORT_ID, 'Jo', 'Jones')
      })
  })
})

describe('multiple results', () => {
  test('GET selecting staff member', () => {
    flash.mockReturnValue([{ firstName: 'Bob', lastName: 'Smith' }])

    draftReportService.findUsers.mockResolvedValue([])
    draftReportService.getCurrentDraft.mockResolvedValue({ agencyId: 'MDI' })
    return request(app)
      .get(paths.selectStaffMember(REPORT_ID))
      .expect('Content-Type', /html/)
      .expect(() => {
        expect(draftReportService.findUsers).toHaveBeenCalledWith('user1-system-token', 'MDI', 'Bob', 'Smith')
      })
  })
  test('POST requires staff member to be selected', () => {
    return request(app)
      .post(paths.selectStaffMember(REPORT_ID))
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.selectStaffMember(REPORT_ID))
  })

  test('POST selecting staff member, triggers redirect', () => {
    draftReportService.addDraftStaffByUsername.mockResolvedValue(AddStaffResult.SUCCESS)
    return request(app)
      .post(paths.selectStaffMember(REPORT_ID))
      .send({ selectedStaffUsername: 'USER-2', firstName: 'BOB', lastName: 'Smith' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', paths.staffInvolved(REPORT_ID))
      .expect(() => {
        expect(draftReportService.addDraftStaffByUsername).toHaveBeenCalledWith(user, REPORT_ID, 'USER-2')
      })
  })
})
