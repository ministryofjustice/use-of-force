import request from 'supertest'
import moment from 'moment'
import { appWithAllRoutes, user, reviewerUser, coordinatorUser } from '../__test/appSetup'
import { Report } from '../../data/incidentClientTypes'
import ReviewService from '../../services/reviewService'
import ReportService from '../../services/reportService'
import ReportEditService from '../../services/reportEditService'
import AuthService from '../../services/authService'
import ReportDetailBuilder, { ReportDetail } from '../../services/reportDetailBuilder'
import config from '../../config'

jest.mock('../../services/reviewService')
jest.mock('../../services/reportService')
jest.mock('../../services/reportEditService')
jest.mock('../../services/authService')
jest.mock('../../services/reportDetailBuilder')

const userSupplier = jest.fn()

const reviewService = new ReviewService(null, null, null, null, null) as jest.Mocked<ReviewService>
const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>
const reportEditService = new ReportEditService(
  null,
  null,
  null,
  null,
  null,
  null,
  null
) as jest.Mocked<ReportEditService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const reportDetailBuilder = new ReportDetailBuilder(null, null, null, null, null) as jest.Mocked<ReportDetailBuilder>
let report = { id: 1, username: 'user1', form: { incidentDetails: {} } } as unknown as Report

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

const statements = [
  {
    id: 1,
    reportId: 1,
    name: 'Test User',
    email: 'test.user@justice.gov.uk',
    userId: 'TUSER_GEN',
    isOverdue: false,
    isSubmitted: true,
    isRemovalRequested: false,
    bookingId: 159466,
    incidentDate: new Date('2025-06-23T07:00:00.000Z'),
    lastTrainingMonth: 1,
    lastTrainingYear: 2025,
    jobStartYear: 2000,
    statement: 'abc test test test.',
    submittedDate: new Date('2025-06-24T14:11:03.986Z'),
    additionalComments: [],
    isVerified: true,
    location: '',
  },
]

let app

beforeEach(() => {
  userSupplier.mockReturnValue(user)
  authService.getSystemClientToken.mockResolvedValue('user1-system-token')
  config.featureFlagReportEditingEnabled = true
  reviewService.getReport.mockResolvedValue(report)
  reportService.getReportEdits.mockResolvedValue([])
  reportEditService.mapEditDataToViewOutput.mockResolvedValue([])
  reviewService.getStatements.mockResolvedValue(statements)
  reportDetailBuilder.build.mockResolvedValue({
    offenderDetail: {
      displayName: 'John Smith',
    },
  } as ReportDetail)

  app = appWithAllRoutes(
    { reportService, reportEditService, reportDetailBuilder, authService, reviewService },
    userSupplier
  )
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /view-incident', () => {
  it('should render page', () => {
    return request(app)
      .get('/1/view-incident?tab=report&your-report=true')
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

    it('should display print link to coordinator - Statements tab', () => {
      userSupplier.mockReturnValue(coordinatorUser)

      return request(app)
        .get('/1/view-incident?tab=statements')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Print report and statements')
        })
    })

    it('should not display print link if user is reporter only', () => {
      userSupplier.mockReturnValue(user)

      return request(app)
        .get('/1/view-incident?tab=report&your-report=true')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('Print report and statements')
        })
    })

    it('should not display print link if user is reporter only - Statements tab', () => {
      userSupplier.mockReturnValue(user)

      return request(app)
        .get('/1/view-incident?tab=statements')
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
        .get('/1/view-incident?tab=report&your-report=true')
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

  describe('Action buttons - Statements tab', () => {
    it('should display both Edit report and Delete incident buttons to coordinator', () => {
      userSupplier.mockReturnValue(coordinatorUser)

      return request(app)
        .get('/1/view-incident?tab=statements')
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
        .get('/1/view-incident?tab=statements')
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
        .get('/1/view-incident?tab=statements')
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
      userSupplier.mockReturnValue(reviewerUser)

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
        .get('/1/view-incident?tab=report&your-report=true')
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
      userSupplier.mockReturnValue(coordinatorUser)
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
      userSupplier.mockReturnValue(coordinatorUser)
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
        .get('/1/view-incident?tab=xyz&your-report=true')
        .expect('Content-Type', /text\/plain/)
        .expect(302)
        .expect('Location', '/1/view-incident?tab=report')
    })
  })

  describe('Report body', () => {
    it('should not include report edited row', () => {
      return request(app)
        .get('/1/view-incident?tab=report&your-report=true')
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
        .get('/1/view-incident?tab=report&your-report=true')
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
        .get('/1/view-incident?tab=report&your-report=true')
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
        .get('/1/view-incident?tab=report&your-report=true')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Report details')
          expect(res.text).toContain('Incident details')
          expect(res.text).toContain('Staff involved')
          expect(res.text).toContain('Name')
          expect(res.text).toContain('Email address')
          expect(res.text).toContain('Use of force details')
          expect(res.text).toContain('Relocation and injuries')
          expect(res.text).toContain('Evidence')
        })
    })

    it("should prevent user accessing reports they didn't create from /your-reports", () => {
      report = { id: 2, username: 'user2', form: { incidentDetails: {} } } as unknown as Report
      reviewService.getReport.mockResolvedValue(report)

      return request(app)
        .get(`/999/view-incident?tab=report&your-report=true`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.status).toBe(200)
          expect(res.text).toContain('You are not the reporter for report 999')
        })
    })
  })

  describe('Edit history tab', () => {
    it('should display the expected columns and  data', () => {
      userSupplier.mockReturnValue(reviewerUser)
      reportEditService.mapEditDataToViewOutput.mockResolvedValue([
        {
          editDate: new Date(),
          editorName: reviewerUser.displayName,
          whatChanged: [
            'Incident date',
            'Prison',
            'Incident location',
            'Was use of force planned',
            'Who authorised use of force',
            'Witnesses to the incident',
          ],
          changedFrom: ['28/07/2025 01:10', 'Whitemoor (HMP)', 'Astro Turf', 'No', undefined, ''],
          changedTo: ['29/07/2025 02:10', 'Ashfield (HMP)', 'Activate Room', 'Yes', 'Joe bloggs', 'Witness A'],
          reason: 'Error in report',
          additionalComments: 'Some additional comments',
        },
      ])
      return request(app)
        .get('/1/view-incident?tab=edit-history')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Edit history')
          expect(res.text).toContain('Date')
          expect(res.text).toContain('Time')
          expect(res.text).toContain('Changed by')
          expect(res.text).toContain('What changed')
          expect(res.text).toContain('Changed from')
          expect(res.text).toContain('Changed to')
          expect(res.text).toContain('Reason for change')
          expect(res.text).toContain('28/07/2025 01:10')
          expect(res.text).toContain('29/07/2025 02:10')
          expect(res.text).toContain('First Last')
          expect(res.text).toContain('Whitemoor (HMP)')
          expect(res.text).toContain('Ashfield (HMP)')
          expect(res.text).toContain('Astro Turf')
          expect(res.text).toContain('Activate Room')
          expect(res.text).toContain('Joe bloggs')
          expect(res.text).toContain('Witness A')
          expect(res.text).toContain('Error in report')
          expect(res.text).toContain('govuk-details__summary')
          expect(res.text).toContain('Some additional comments')
        })
    })
  })

  describe('Statements', () => {
    it('should display the expected heading', () => {
      return request(app)
        .get('/1/view-incident?tab=statements')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Staff members involved')
        })
    })

    it('should include a table of statements', () => {
      return request(app)
        .get('/1/view-incident?tab=statements')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="statements"')
        })
    })

    it('should include a link to return to use of force incidents', () => {
      return request(app)
        .get('/1/view-incident?tab=statements')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="return-link"')
        })
    })

    it('should show the expected name value, including (user id) in the Name field', () => {
      return request(app)
        .get('/1/view-incident?tab=statements')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="name"')
          expect(res.text).toContain(`${statements[0].name} (${statements[0].userId})`)
        })
    })

    it('should show the expected location value in the Location field', () => {
      return request(app)
        .get('/1/view-incident?tab=statements')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="location"')
          expect(res.text).toContain(`${statements[0].location}`)
        })
    })

    it('should show the expected email address value in the Email field', () => {
      return request(app)
        .get('/1/view-incident?tab=statements')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="email"')
          expect(res.text).toContain(`${statements[0].email}`)
        })
    })

    it('should show a SUBMITTED badge in the status column when a statement is submitted', () => {
      return request(app)
        .get('/1/view-incident?tab=statements')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="submitted"')
          expect(res.text).toContain('SUBMITTED')
        })
    })
  })
})
