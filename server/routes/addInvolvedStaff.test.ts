import request from 'supertest'
import { StaffDetails } from '../data/draftReportClientTypes'
import DraftReportService, { AddStaffResult } from '../services/report/draftReportService'
import { appWithAllRoutes, user } from './testutils/appSetup'

jest.mock('../services/report/draftReportService')

const draftReportService = new DraftReportService(null, null, null, null, null, null) as jest.Mocked<DraftReportService>

let app
const flash = jest.fn()

beforeEach(() => {
  app = appWithAllRoutes({ draftReportService }, undefined, false, flash)
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
      .get(`/report/-19/staff-involved`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Staff involved in use of force')
        expect(res.text).toContain('User bob')
        expect(res.text).toContain('bob@justice.gov.uk')
        expect(draftReportService.getInvolvedStaffWithPrisons).toHaveBeenCalledWith('user1-system-token', 'user1', -19)
      })
  })

  test('POST requires an option to be selected', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    return request(app)
      .post(`/report/-19/staff-involved`)
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-involved')
  })

  test('POST no more staff to add, triggers redirect', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    return request(app)
      .post(`/report/-19/staff-involved`)
      .send({ addMore: 'no' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/use-of-force-details')
      .expect(() => {
        expect(draftReportService.markInvolvedStaffComplete).toHaveBeenCalledWith(user, -19)
      })
  })

  test('POST no more staff to add when save and returning marks complete', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    return request(app)
      .post(`/report/-19/staff-involved`)
      .send({ addMore: 'no', submitType: 'save-and-return' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/report-use-of-force')
      .expect(() => {
        expect(draftReportService.markInvolvedStaffComplete).toHaveBeenCalledWith(user, -19)
      })
  })

  test('POST no more staff to add when report is complete', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    draftReportService.isDraftComplete.mockResolvedValue(true)
    return request(app)
      .post(`/report/-19/staff-involved`)
      .send({ addMore: 'no', submitType: 'save-and-continue' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/check-your-answers')
      .expect(() => {
        expect(draftReportService.markInvolvedStaffComplete).toHaveBeenCalledWith(user, -19)
      })
  })

  test('POST more staff to add, triggers redirect', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    return request(app)
      .post(`/report/-19/staff-involved`)
      .send({ addMore: 'yes' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-member-name')
  })
})

describe('delete staff page', () => {
  test('GET should display content and staff to delete', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([{ username: 'USER-1', name: 'BOB SMITH' }])
    return request(app)
      .get(`/report/-19/delete-staff-member/USER-1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Are you sure you want to delete Bob Smith?')
      })
  })

  test('POST requires confirmation option to be selected', () => {
    return request(app)
      .post(`/report/-19/delete-staff-member/USER-1`)
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/delete-staff-member/USER-1')
  })

  test('POST selecting do not delete, triggers redirect', () => {
    return request(app)
      .post(`/report/-19/delete-staff-member/USER-1`)
      .send({ confirm: 'no' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-involved')
      .expect(() => {
        expect(draftReportService.deleteInvolvedStaff).not.toBeCalled()
      })
  })

  test('POST selecting do not delete, triggers redirect', () => {
    return request(app)
      .post(`/report/-19/delete-staff-member/USER-1`)
      .send({ confirm: 'yes' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-involved')
      .expect(() => {
        expect(draftReportService.deleteInvolvedStaff).toBeCalledWith(user, -19, 'USER-1')
      })
  })
})

describe('submit staff', () => {
  test('GET should display title', () => {
    return request(app)
      .get(`/report/-19/staff-member-name`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('What is the staff member&#39;s name?')
      })
  })

  test('POST requires name specifying. First and last names missing', () => {
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-member-name')
  })

  test('POST requires name specifying. First name missing', () => {
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .send({ lastName: 'Jones' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-member-name')
  })

  test('POST requires name specifying. Last name missing', () => {
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .send({ firstName: 'Jo' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-member-name')
  })

  test('POST staff added successfully', () => {
    draftReportService.addDraftStaffByName.mockResolvedValue(AddStaffResult.SUCCESS)
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .send({ firstName: 'Jo', lastName: 'Jones' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-involved')
      .expect(() => {
        expect(draftReportService.addDraftStaffByName).toBeCalledWith(user, -19, 'Jo', 'Jones')
      })
  })

  test('POST staff added when unverified', () => {
    draftReportService.addDraftStaffByName.mockResolvedValue(AddStaffResult.SUCCESS_UNVERIFIED)
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .send({ firstName: 'Jo', lastName: 'Jones' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-involved')
      .expect(() => {
        expect(draftReportService.addDraftStaffByName).toBeCalledWith(user, -19, 'Jo', 'Jones')
      })
  })

  test('POST we do not handle when staff already added to report', () => {
    draftReportService.addDraftStaffByName.mockResolvedValue(AddStaffResult.ALREADY_EXISTS)
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .send({ firstName: 'Jo', lastName: 'Jones' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-involved')
      .expect(() => {
        expect(draftReportService.addDraftStaffByName).toBeCalledWith(user, -19, 'Jo', 'Jones')
      })
  })

  test('POST staff not added as missing user', () => {
    draftReportService.addDraftStaffByName.mockResolvedValue(AddStaffResult.MISSING)
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .send({ firstName: 'Jo', lastName: 'Jones' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-member-not-found')
      .expect(() => {
        expect(draftReportService.addDraftStaffByName).toBeCalledWith(user, -19, 'Jo', 'Jones')
      })
  })
})

describe('multiple results', () => {
  test('GET selecting staff member', () => {
    flash.mockReturnValue([{ firstName: 'Bob', lastName: 'Smith' }])

    draftReportService.findUsers.mockResolvedValue([])
    draftReportService.getCurrentDraft.mockResolvedValue({ agencyId: 'MDI' })
    return request(app)
      .get(`/report/-19/select-staff-member`)
      .expect('Content-Type', /html/)
      .expect(() => {
        expect(draftReportService.findUsers).toBeCalledWith('user1-system-token', 'MDI', 'Bob', 'Smith')
      })
  })
  test('POST requires staff member to be selected', () => {
    return request(app)
      .post(`/report/-19/select-staff-member`)
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/select-staff-member')
  })

  test('POST selecting staff member, triggers redirect', () => {
    draftReportService.addDraftStaffByUsername.mockResolvedValue(AddStaffResult.SUCCESS)
    return request(app)
      .post(`/report/-19/select-staff-member`)
      .send({ selectedStaffUsername: 'USER-2', firstName: 'BOB', lastName: 'Smith' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-involved')
      .expect(() => {
        expect(draftReportService.addDraftStaffByUsername).toBeCalledWith(user, -19, 'USER-2')
      })
  })
})
