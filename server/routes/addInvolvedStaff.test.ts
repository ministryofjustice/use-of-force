import request from 'supertest'
import { StaffDetails } from '../data/draftReportClientTypes'
import DraftReportService, { AddStaffResult } from '../services/report/draftReportService'
import { appWithAllRoutes, user } from './testutils/appSetup'

jest.mock('../services/report/draftReportService')

const draftReportService = new DraftReportService(null, null, null, null, null) as jest.Mocked<DraftReportService>

let app

beforeEach(() => {
  app = appWithAllRoutes({ draftReportService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('staff involved page', () => {
  test('GET should display content and current staff', () => {
    draftReportService.getInvolvedStaff.mockResolvedValue([
      { name: 'User bob', email: 'bob@justice.gov.uk' } as StaffDetails,
    ])
    return request(app)
      .get(`/report/-19/staff-involved`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Staff involved in use of force')
        expect(res.text).toContain('User bob')
        expect(res.text).toContain('bob@justice.gov.uk')
        expect(draftReportService.getInvolvedStaff).toHaveBeenCalledWith('user1-system-token', 'user1', -19)
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
    return request(app)
      .get(`/report/-19/delete-staff-member/USER-1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Are you sure you want to delete USER-1?')
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
        expect(res.text).toContain('What is the staff member&#39;s username?')
      })
  })

  test('POST requires username specifying', () => {
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-member-name')
  })

  test('POST staff added successfully', () => {
    draftReportService.addDraftStaff.mockResolvedValue(AddStaffResult.SUCCESS)
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .send({ username: 'user-1' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-involved')
      .expect(() => {
        expect(draftReportService.addDraftStaff).toBeCalledWith(user, -19, 'user-1')
      })
  })

  test('POST staff added when unverified', () => {
    draftReportService.addDraftStaff.mockResolvedValue(AddStaffResult.SUCCESS_UNVERIFIED)
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .send({ username: 'user-1' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-involved')
      .expect(() => {
        expect(draftReportService.addDraftStaff).toBeCalledWith(user, -19, 'user-1')
      })
  })

  test('POST we do not handle when staff already added to report', () => {
    draftReportService.addDraftStaff.mockResolvedValue(AddStaffResult.ALREADY_EXISTS)
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .send({ username: 'user-1' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-involved')
      .expect(() => {
        expect(draftReportService.addDraftStaff).toBeCalledWith(user, -19, 'user-1')
      })
  })

  test('POST staff not added as missing user', () => {
    draftReportService.addDraftStaff.mockResolvedValue(AddStaffResult.MISSING)
    return request(app)
      .post(`/report/-19/staff-member-name`)
      .send({ username: 'user-1' })
      .expect('Content-Type', /text\/plain/)
      .expect('Location', '/report/-19/staff-member-not-found')
      .expect(() => {
        expect(draftReportService.addDraftStaff).toBeCalledWith(user, -19, 'user-1')
      })
  })
})
