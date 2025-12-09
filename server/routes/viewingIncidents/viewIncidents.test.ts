/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest'
import { appWithAllRoutes, user, reviewerUser, coordinatorUser } from '../__test/appSetup'
import { Report, ReportEdit } from '../../data/incidentClientTypes'
import ReviewService from '../../services/reviewService'
import ReportService from '../../services/reportService'
import ReportEditService from '../../services/reportEditService'
import AuthService from '../../services/authService'
import ReportDetailBuilder, { ReportDetail } from '../../services/reportDetailBuilder'
import config from '../../config'
import ViewIncidentsRoutes from './viewIncidents'
import logger from '../../../log'

jest.mock('../../services/reviewService')
jest.mock('../../services/reportService')
jest.mock('../../services/reportEditService')
jest.mock('../../services/authService')
jest.mock('../../services/reportDetailBuilder')

const userSupplier = jest.fn()
// eslint-disable-next-line @typescript-eslint/no-empty-function
const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {})

const reviewService = new ReviewService(null, null, null, null, null) as jest.Mocked<ReviewService>
const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>
const reportEditService = new ReportEditService(
  null,
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
let report = {} as unknown as Report

const reportEdits = [
  {
    id: 2,
    editDate: new Date('2025-11-01 09:00:00.000'),
    editorUserId: 'HARRY_ID',
    editorName: 'HARRY',
    reportId: 1,
    changes: { someChange: { oldValue: true, newValue: false } },
    reason: 'chose wrong answer',
    reasonText: '',
    additionalComments: '',
    reportOwnerChanged: false,
  },
  {
    id: 1,
    editDate: new Date('2025-05-13 10:30:43.122'),
    editorUserId: 'TOM_ID',
    editorName: 'TOM',
    reportId: 1,
    changes: { someChange: { oldValue: true, newValue: false } },
    reason: 'chose wrong answer',
    reasonText: '',
    additionalComments: '',
    reportOwnerChanged: false,
  },
] as ReportEdit[]

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
  report = { id: 1, username: 'user1', form: { incidentDetails: {} } } as unknown as Report
  userSupplier.mockReturnValue(user)
  authService.getSystemClientToken.mockResolvedValue('user1-system-token')
  config.featureFlagReportEditingEnabled = true
  reviewService.getReport.mockResolvedValue(report)
  reportService.getReportEdits.mockResolvedValue([])
  reportEditService.mapEditDataToViewOutput.mockResolvedValue([])
  reviewService.getStatements.mockResolvedValue(statements)
  reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(false)

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
      .get('/1/view-incident?tab=report')
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

describe('Edit report allowability banner', () => {
  it('should display banner to coordinator only', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(false)
    userSupplier.mockReturnValue(coordinatorUser)

    return request(app)
      .get('/1/view-incident?tab=report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You cannot edit this report')
      })
  })

  it('should not display banner to non-coordinator (reviewer)', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(false)
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get('/1/view-incident?tab=report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('You cannot edit this report')
      })
  })

  it('should not display banner to non-coordinator (reporter)', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(false)
    userSupplier.mockReturnValue(user)

    return request(app)
      .get('/1/view-incident?tab=report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('You cannot edit this report')
      })
  })
})

describe('Action buttons', () => {
  it('should display both Edit report and Delete incident buttons to coordinator if report completion date within permitted timescales', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(true)
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

  it('should not display Edit report or Delete incident buttons to coordinator if report completion date outside permitted timescales', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(false)
    userSupplier.mockReturnValue(coordinatorUser)

    return request(app)
      .get('/1/view-incident?tab=report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('data-qa="button-edit-report"')
        expect(res.text).not.toContain('data-qa="button-delete-incident"')
      })
  })

  it('should not display Edit report or Delete incident buttons if reporter only', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(true)
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
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(true)
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
    userSupplier.mockReturnValue(coordinatorUser)
    reportService.getReportEdits.mockResolvedValue(reportEdits)

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
      .get('/1/view-incident?tab=xyz')
      .expect('Content-Type', /text\/plain/)
      .expect(302)
      .expect('Location', '/1/view-incident?tab=report')
  })
})

describe('Report tab', () => {
  it('should render page', () => {
    return request(app)
      .get('/1/view-incident?tab=report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incident 1')
      })
  })

  it('should render page if user is reporter only, i.e. not reviewer/coordinator, and is the report owner', () => {
    userSupplier.mockReturnValue(user)
    return request(app)
      .get('/1/view-incident?tab=report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incident 1')
      })
  })

  it('should not show report if user is not the reporter owner or reviewer/coordinator', () => {
    userSupplier.mockReturnValue(user)
    report.username = 'user9'
    return request(app)
      .get('/1/view-incident?tab=report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Access denied because you are not the owner of report 1')
      })
  })

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

  it('should include report edited row', () => {
    reportService.getReportEdits.mockResolvedValue([reportEdits[1]])
    return request(app)
      .get('/1/view-incident?tab=report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incident 1')
        expect(res.text).toContain('Report last edited')
      })
  })

  it('should show latest edit in Report last edited row of Report details section', () => {
    reportService.getReportEdits.mockResolvedValue(reportEdits)
    return request(app)
      .get('/1/view-incident?tab=report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('1 November 2025 at 09:00 by HARRY')
        expect(res.text).not.toContain('13 May 2025 at 10:30 by TOM')
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
      .get(`/999/view-incident?tab=report`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.status).toBe(200)
        expect(res.text).toContain('Access denied because you are not the owner of report 999')
      })
  })

  it('should include a link to return to the use of force incidents page', () => {
    userSupplier.mockReturnValue(coordinatorUser)
    return request(app)
      .get('/1/view-incident?tab=report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('data-qa="use-of-force-incidents-link"')
        expect(res.text).toContain('/not-completed-incidents')
      })
  })
})

describe('Statements tab', () => {
  it('should display both Edit report and Delete incident buttons to coordinator and report completion date is within permitted timescales', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(true)
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

  it('should display both Edit report and Delete incident buttons to coordinator and report completion date is outside permitted timescales', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(false)
    userSupplier.mockReturnValue(coordinatorUser)

    return request(app)
      .get('/1/view-incident?tab=statements')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('data-qa="button-edit-report"')
        expect(res.text).not.toContain('data-qa="button-delete-incident"')
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

describe('Edit history tab', () => {
  it('should display both Edit report and Delete incident buttons to coordinator if report completion date is within permitted timescales', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(true)
    userSupplier.mockReturnValue(coordinatorUser)

    return request(app)
      .get('/1/view-incident?tab=edit-history')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('data-qa="button-edit-report"')
        expect(res.text).toContain('data-qa="button-delete-incident"')
      })
  })

  it('should not display Edit report or Delete incident buttons to coordinator if report completion date is outside permitted timescales', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(false)
    userSupplier.mockReturnValue(coordinatorUser)

    return request(app)
      .get('/1/view-incident?tab=edit-history')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('data-qa="button-edit-report"')
        expect(res.text).not.toContain('data-qa="button-delete-incident"')
      })
  })

  it('should not display Edit report or Delete incident buttons to just reporter', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(true)
    userSupplier.mockReturnValue(user)

    return request(app)
      .get('/1/view-incident?tab=edit-history')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('data-qa="button-edit-report"')
        expect(res.text).not.toContain('data-qa="button-delete-incident"')
      })
  })

  it('should not display Edit report or Delete incident buttons to reviewer', () => {
    reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(true)
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get('/1/view-incident?tab=edit-history')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('data-qa="button-edit-report"')
        expect(res.text).not.toContain('data-qa="button-delete-incident"')
      })
  })
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

  it('use-of-force-incidents-link should point to /your-statements if user not coordinator or reviewer', () => {
    return request(app)
      .get('/1/view-incident?tab=edit-history')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('data-qa="use-of-force-incidents-link"')
        expect(res.text).toContain('href="/your-statements"')
      })
  })

  it('use-of-force-incidents-link should point to /not-completed-incidents if user is reviewer', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get('/1/view-incident?tab=edit-history')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('data-qa="use-of-force-incidents-link"')
        expect(res.text).toContain('href="/not-completed-incidents"')
      })
  })

  it('use-of-force-incidents-link should point to /not-completed-incidents if user is coordinator', () => {
    userSupplier.mockReturnValue(coordinatorUser)

    return request(app)
      .get('/1/view-incident?tab=edit-history')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('data-qa="use-of-force-incidents-link"')
        expect(res.text).toContain('href="/not-completed-incidents"')
      })
  })

  it('should not display edit history if user is not the report owner, reviewer or coordinator', () => {
    userSupplier.mockReturnValue(user)
    userSupplier.mockReturnValue({ username: 'someOtherUser', roles: [] })

    return request(app)
      .get('/1/view-incident?tab=edit-history')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Access denied because you are not the owner of report 1')
        expect(loggerInfoSpy).toHaveBeenCalledWith(
          'someOtherUser attempted to access edit history for report 1 even though they are not the reporter or a reviewer/coordinator'
        )
      })
  })
})

describe('deleteAnyPendingEditsForThisReport', () => {
  let viewIncidentsRoutes: ViewIncidentsRoutes

  beforeEach(() => {
    viewIncidentsRoutes = new ViewIncidentsRoutes(
      reportService,
      reportEditService,
      reportDetailBuilder,
      reviewService,
      authService
    )
  })

  it('should remove the entry with the given reportId from session.incidentReport', () => {
    const req = {
      session: {
        incidentReport: [
          { reportId: 1, data: 'foo' },
          { reportId: 2, data: 'bar' },
        ],
      },
    } as any
    viewIncidentsRoutes.deleteAnyPendingEditsForThisReport(req, 1)
    expect(req.session.incidentReport).toEqual([{ reportId: 2, data: 'bar' }])
  })

  it('should do nothing if session.incidentReport is not an array', () => {
    const req = { session: { incidentReport: {} } } as any
    viewIncidentsRoutes.deleteAnyPendingEditsForThisReport(req, 1)
    expect(req.session.incidentReport).toEqual({})
  })

  it('should do nothing if session.incidentReport is undefined', () => {
    const req = { session: {} } as any
    viewIncidentsRoutes.deleteAnyPendingEditsForThisReport(req, 1)
    expect(req.session.incidentReport).toBeUndefined()
  })
})

describe('ViewIncidentsRoutes', () => {
  let viewIncidentsRoutes: any
  let req: any
  let res: any

  beforeEach(() => {
    viewIncidentsRoutes = new ViewIncidentsRoutes(
      reportService,
      reportEditService,
      reportDetailBuilder,
      reviewService,
      authService
    )
    req = {
      params: { incidentId: '123' },
      session: {},
      query: {},
      user: {},
      flash: jest.fn().mockReturnValue([{}]),
      res: {},
      ...{
        locals: { user: { isCoordinator: true, username: 'user1' } },
      },
    }
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      locals: req.locals,
    }
  })

  it('should call deleteAnyPendingEditsForThisReport with the correct incidentId', async () => {
    const spy = jest.spyOn(viewIncidentsRoutes, 'deleteAnyPendingEditsForThisReport')
    reviewService.getReport.mockResolvedValue({ username: 'user1', form: {} } as Report)
    reportService.getReportEdits.mockResolvedValue([])
    reportEditService.mapEditDataToViewOutput.mockResolvedValue([])
    reportDetailBuilder.build.mockResolvedValue({ offenderDetail: {}, form: {} } as unknown as ReportDetail)
    authService.getSystemClientToken.mockResolvedValue('token')
    reviewService.getStatements.mockResolvedValue([])

    await viewIncidentsRoutes.viewIncident(req, res)
    expect(spy).toHaveBeenCalledWith(req, 123)
  })
})
