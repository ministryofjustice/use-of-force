import request from 'supertest'
import moment from 'moment'
import { appWithAllRoutes, user, reviewerUser, coordinatorUser } from '../__test/appSetup'
import { Report } from '../../data/incidentClientTypes'
import ReviewService from '../../services/reviewService'
import ReportService from '../../services/reportService'
import AuthService from '../../services/authService'
import ReportDetailBuilder from '../../services/reportDetailBuilder'
import config from '../../config'

jest.mock('../../services/reviewService')
jest.mock('../../services/reportService')
jest.mock('../../services/authService')
jest.mock('../../services/reportDetailBuilder')

const userSupplier = jest.fn()

const reviewService = new ReviewService(null, null, null, null, null) as jest.Mocked<ReviewService>
const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const reportDetailBuilder = new ReportDetailBuilder(null, null, null, null, null) as jest.Mocked<ReportDetailBuilder>
const report = { id: 1, form: { incidentDetails: {} } } as unknown as Report

const reportEdit = {
  id: 1,
  editDate: moment('2025-05-13 10:30:43.122'),
  editorUserId: 'TOM_ID',
  editorName: 'TOM',
  reportId: 1,
  changeTo: 'PAVA',
  oldValuePrimary: 'true',
  newValuePrimary: 'false',
  reason: 'chose wrong answer',
  reportOwnerChanged: false,
}

let app

beforeEach(() => {
  userSupplier.mockReturnValue(user)
  authService.getSystemClientToken.mockResolvedValue('user1-system-token')
  config.featureFlagReportEditingEnabled = true
  reportService.getReport.mockResolvedValue(report)
  reportService.getReportEdits.mockResolvedValue([])
  reviewService.getStatements.mockResolvedValue([])
  app = appWithAllRoutes({ reportService, reportDetailBuilder, authService, reviewService }, userSupplier)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /view-incident', () => {
  it('should render page', () => {
    return request(app)
      .get('/1/view-incident?tab=report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incident 1')
      })
  })

  describe('Print link', () => {
    it('should display print link to reviewer', () => {
      userSupplier.mockReturnValue(reviewerUser)

      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Print report and statements')
        })
    })
    it('should display print link to coordinator', () => {
      userSupplier.mockReturnValue(coordinatorUser)

      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Print report and statements')
        })
    })
    it('should not display print link if user is reporter only', () => {
      userSupplier.mockReturnValue(user)

      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('Print report and statements')
        })
    })
  })

  describe('Action buttons', () => {
    it('should display both Edit report and Delete incident buttons to coordinator', () => {
      userSupplier.mockReturnValue(coordinatorUser)

      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="button-edit-report"')
          expect(res.text).toContain('data-qa="button-delete-incident"')
        })
    })
    it('should not display Edit report or Delete incident buttons to just reporter', () => {
      userSupplier.mockReturnValue(user)

      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('data-qa="button-edit-report"')
          expect(res.text).not.toContain('data-qa="button-delete-incident"')
        })
    })
    it('should not display Edit report or Delete incident buttons to reviewer', () => {
      userSupplier.mockReturnValue(reviewerUser)

      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('data-qa="button-edit-report"')
          expect(res.text).not.toContain('data-qa="button-delete-incident"')
        })
    })
  })

  describe('Tabs', () => {
    it('should display report tab ', () => {
      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="report-tab"')
        })
    })

    it('should not display statements tab if user is reporter only', () => {
      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('data-qa="statements-tab"')
        })
    })
    it('should display statements tab to reviewer', () => {
      userSupplier.mockReturnValue(reviewerUser)

      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="statements-tab"')
        })
    })

    it('should display statements tab to coordinator', () => {
      userSupplier.mockReturnValue(coordinatorUser)

      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="statements-tab"')
        })
    })

    it('should display edit History tab if report has been edited', () => {
      reportService.getReportEdits.mockResolvedValue([reportEdit])

      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="edit-history-tab"')
        })
    })

    it('should not display edit History tab if report has not been edited', () => {
      reportService.getReportEdits.mockResolvedValue([])

      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('data-qa="edit-history-tab"')
        })
    })

    it('should redirect to report tab if user tries to access unknown tab', () => {
      return request(app)
        .get('/1/view-incident?tab=xyz')
        .expect('Content-Type', /text\/plain/)
        .expect(302)
        .expect('Location', '/1/view-incident?tab=report')
    })
  })

  describe('Report body', () => {
    it('should not include report edited row', () => {
      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Use of force incident 1')
          expect(res.text).not.toContain('Report last edited')
          expect(res.text).not.toContain('Current report owner')
        })
    })

    it('should include report edited row but not current owner row', () => {
      reportService.getReportEdits.mockResolvedValue([reportEdit])
      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Use of force incident 1')
          expect(res.text).toContain('Report last edited')
          expect(res.text).not.toContain('Current report owner')
        })
    })

    it('should include both report edited and current owner rows', () => {
      reportService.getReportEdits.mockResolvedValue([
        { ...reportEdit, reportOwnerChanged: true, newValuePrimary: 'BOB (BOB_ID)' },
      ])
      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Use of force incident 1')
          expect(res.text).toContain('Report last edited')
          expect(res.text).toContain('Current report owner')
          expect(res.text).toContain('BOB (BOB_ID)')
        })
    })

    it('should include all the six main sections of report', () => {
      return request(app)
        .get('/1/view-incident?tab=report')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Report details')
          expect(res.text).toContain('Incident details')
          expect(res.text).toContain('Staff involved')
          expect(res.text).toContain('Use of force details')
          expect(res.text).toContain('Relocation and injuries')
          expect(res.text).toContain('Evidence')
        })
    })
  })
})
