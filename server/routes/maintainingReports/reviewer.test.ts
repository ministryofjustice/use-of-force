import request from 'supertest'
import { appWithAllRoutes, user, reviewerUser, coordinatorUser } from '../__test/appSetup'
import { parseDate } from '../../utils/utils'
import { PageResponse } from '../../utils/page'
import type { ReportDetail } from '../../services/reportDetailBuilder'
import { Report } from '../../data/incidentClientTypes'
import ReviewService, { ReviewerStatementWithComments } from '../../services/reviewService'
import OffenderService from '../../services/offenderService'
import AuthService from '../../services/authService'
import ReportDetailBuilder from '../../services/reportDetailBuilder'
import config from '../../config'

const userSupplier = jest.fn()

jest.mock('../../services/reviewService')
jest.mock('../../services/offenderService')
jest.mock('../../services/authService')
jest.mock('../../services/reportDetailBuilder')

const reviewService = new ReviewService(null, null, null, null, null) as jest.Mocked<ReviewService>
const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const reportDetailBuilder = new ReportDetailBuilder(null, null, null, null, null) as jest.Mocked<ReportDetailBuilder>
const report = { id: 1, form: { incidentDetails: {} } } as unknown as Report

let app

beforeEach(() => {
  userSupplier.mockReturnValue(user)
  reviewService.getReport.mockResolvedValue({} as Report)
  authService.getSystemClientToken.mockResolvedValue('user1-system-token')
  app = appWithAllRoutes({ offenderService, reviewService, reportDetailBuilder, authService }, userSupplier)
  reviewService.getIncompleteReports.mockResolvedValue([])
  reviewService.getCompletedReports.mockResolvedValue(
    new PageResponse({ min: 0, max: 0, page: 1, totalCount: 0, totalPages: 1 }, [])
  )
  offenderService.getOffenderDetails.mockResolvedValue({ displayName: 'Jimmy Choo', offenderNo: '123456' })
  reportDetailBuilder.build.mockResolvedValue({} as ReportDetail)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe(`GET /completed-incidents`, () => {
  it('should render page for reviewer', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get(`/completed-incidents`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
      })
  })

  it('should pass search query params through', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get(
        '/completed-incidents?prisonNumber=A1234AA&reporter=Bob&&dateFrom=09/01/2020&dateTo=15/01/2020&prisonerName=Jimmy Choo'
      )
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
        expect(reviewService.getCompletedReports).toHaveBeenCalledWith(
          'user1',
          'LEI',
          {
            dateFrom: parseDate('09/01/2020', 'DD/MM/YYYY'),
            dateTo: parseDate('15/01/2020', 'DD/MM/YYYY').endOf('day'),
            prisonNumber: 'A1234AA',
            reporter: 'Bob',
            prisonerName: 'Jimmy Choo',
          },
          1
        )
      })
  })

  it('should pass search query params through to page params', () => {
    userSupplier.mockReturnValue(reviewerUser)
    reviewService.getCompletedReports.mockResolvedValue(
      new PageResponse(
        { min: 1, max: 20, totalCount: 200, totalPages: 10, page: 1, nextPage: 2, previousPage: null },
        []
      )
    )
    return request(app)
      .get(
        '/completed-incidents?prisonNumber=A1234AA&reporter=Bob&dateFrom=9 Jan 2020&dateTo=15 Jan 2020&prisonerName=Jimmy Choo'
      )
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          '<a class="moj-pagination__link" href="?prisonNumber=A1234AA&amp;reporter=Bob&amp;dateFrom=9%20Jan%202020&amp;dateTo=15%20Jan%202020&amp;prisonerName=Jimmy%20Choo&amp;page=3'
        )
      })
  })

  it('should handle invalid dates', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get('/completed-incidents?prisonNumber=A1234AA&reporter=Bob&dateFrom=&dateTo=blarh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
        expect(reviewService.getCompletedReports).toHaveBeenCalledWith(
          'user1',
          'LEI',
          {
            prisonNumber: 'A1234AA',
            reporter: 'Bob',
          },
          1
        )
      })
  })

  it('should not allow if not reviewer', () => {
    userSupplier.mockReturnValue(user)
    return request(app)
      .get('/completed-incidents')
      .expect(401)
      .expect(res => expect(res.text).toContain('Not authorised to access this resource'))
  })
})

describe(`GET /not-completed-incidents`, () => {
  const commonReportData = {
    id: 1,
    bookingId: 1,
    incidentdate: new Date(),
    staffMemberName: 'Coordinator Use-Of-Force',
    isOverdue: true,
    isRemovalRequested: false,
    offenderName: 'Strudwick, Stephen',
    offenderNo: 'Z0019ZZ',
  }

  it('should render page for reviewer', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get(`/not-completed-incidents`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
        expect(reviewService.getIncompleteReports).toHaveBeenCalledWith('user1', 'LEI')
      })
  })

  it('should not allow if not reviewer', () => {
    userSupplier.mockReturnValue(user)
    return request(app)
      .get('/not-completed-incidents')
      .expect(401)
      .expect(res => expect(res.text).toContain('Not authorised to access this resource'))
  })

  it('should display the OVERDUE badge but not REMOVAL REQUEST badge', () => {
    userSupplier.mockReturnValue(coordinatorUser)
    reviewService.getIncompleteReports.mockResolvedValue([
      { ...commonReportData, isOverdue: true, isRemovalRequested: false },
    ])

    return request(app)
      .get('/not-completed-incidents')
      .expect(200)
      .expect(res => expect(res.text).toContain('OVERDUE'))
      .expect(res => expect(res.text).not.toContain('REMOVAL REQUEST'))
  })
  it('should display the REMOVAL REQUEST badge but not OVERDUE badge', () => {
    userSupplier.mockReturnValue(coordinatorUser)
    reviewService.getIncompleteReports.mockResolvedValue([
      { ...commonReportData, isOverdue: false, isRemovalRequested: true },
    ])

    return request(app)
      .get('/not-completed-incidents')
      .expect(200)
      .expect(res => expect(res.text).not.toContain('OVERDUE'))
      .expect(res => expect(res.text).toContain('REMOVAL REQUEST'))
  })
  it('should display both the REMOVAL REQUEST and OVERDUE badges', () => {
    userSupplier.mockReturnValue(coordinatorUser)
    reviewService.getIncompleteReports.mockResolvedValue([
      { ...commonReportData, isOverdue: true, isRemovalRequested: true },
    ])

    return request(app)
      .get('/not-completed-incidents')
      .expect(200)
      .expect(res => expect(res.text).toContain('OVERDUE'))
      .expect(res => expect(res.text).toContain('REMOVAL REQUEST'))
  })
})

describe('GET /view-report', () => {
  it('should render page for reviewer', () => {
    config.featureFlagReportEditingEnabled = true
    app = appWithAllRoutes({ offenderService, reviewService, reportDetailBuilder, authService }, userSupplier)
    userSupplier.mockReturnValue(reviewerUser)
    reviewService.getReport.mockResolvedValue(report)
    return request(app)
      .get('/1/view-report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incident')
        expect(res.text).not.toContain('Delete incident')
        expect(res.text).not.toContain('Edit report')
      })
  })

  it('should render page for coordinator', () => {
    config.featureFlagReportEditingEnabled = true
    app = appWithAllRoutes({ offenderService, reviewService, reportDetailBuilder, authService }, userSupplier)

    userSupplier.mockReturnValue(coordinatorUser)
    reviewService.getReport.mockResolvedValue(report)
    return request(app)
      .get('/1/view-report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incident')
        expect(res.text).toContain('Delete incident')
        expect(res.text).toContain('Edit report')
      })
  })
})

describe('GET /view-statements', () => {
  const commonStatementData = {
    id: 1,
    reportId: 10,
    name: 'Mr Coordinator',
    userId: 'COORDINATOR_USER',
    isSubmitted: false,
    bookingId: 1,
    incidentDate: new Date(),
    lastTrainingMonth: null,
    lastTrainingYear: null,
    jobStartYear: null,
    statement: null,
    submittedDate: null,
    additionalComments: [],
    isVerified: true,
  }

  it('should render page if reviewer', () => {
    userSupplier.mockReturnValue(reviewerUser)
    reviewService.getReport.mockResolvedValue(report)
    reviewService.getStatements.mockResolvedValue([])
    return request(app)
      .get('/1/view-statements')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incident')
      })
  })

  it('should not allow if not reviewer', () => {
    userSupplier.mockReturnValue(user)
    reviewService.getReport.mockResolvedValue(report)
    reviewService.getStatements.mockResolvedValue([])
    return request(app)
      .get('/1/view-statements')
      .expect(401)
      .expect(res => expect(res.text).toContain('Not authorised to access this resource'))
  })

  it('should error if report doesnt exist', () => {
    userSupplier.mockReturnValue(reviewerUser)
    reviewService.getReport.mockReturnValue(null)
    reviewService.getStatements.mockResolvedValue([])
    return request(app).get('/1/view-statements').expect(500)
  })

  it('should render page if coordinator', () => {
    userSupplier.mockReturnValue(coordinatorUser)
    reviewService.getReport.mockResolvedValue(report)
    reviewService.getStatements.mockResolvedValue([])
    return request(app)
      .get('/1/view-statements')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incident')
      })
  })

  const statement = (params: { id: number; submitted: boolean }): ReviewerStatementWithComments =>
    ({
      id: params.id,
      isOverdue: false,
      isSubmitted: params.submitted,
      statement: `Statement for user ${params.id}`,
      isVerified: true,
      name: `User ${params.id}`,
      userId: `USER_${params.id}`,
    } as ReviewerStatementWithComments)

  it('should only render submitted statements', async () => {
    userSupplier.mockReturnValue(coordinatorUser)

    const statementOne = statement({ id: 1, submitted: true })
    const statementTwo = statement({ id: 2, submitted: false })
    const statementThree = statement({ id: 3, submitted: true })

    reviewService.getStatements.mockResolvedValue([statementOne, statementTwo, statementThree])

    return request(app)
      .get('/1/view-statements')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(statementOne.statement)
        expect(res.text).not.toContain(statementTwo.statement)
        expect(res.text).toContain(statementThree.statement)
        expect(reviewService.getStatements).toHaveBeenCalledWith('user1-system-token', 1)
      })
  })

  it('should display OVERDUE badge but not REMOVAL REQUEST badge or removal request link', () => {
    userSupplier.mockReturnValue(coordinatorUser)
    reviewService.getStatements.mockResolvedValue([
      { ...commonStatementData, isOverdue: true, isRemovalRequested: false },
    ])

    return request(app)
      .get('/10/view-statements')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('OVERDUE')
        expect(res.text).not.toContain('REMOVAL REQUEST')
        expect(res.text).not.toContain('View removal request')
      })
  })

  it('should display REMOVAL REQUEST badge and removal request link but not OVERDUE badge', () => {
    userSupplier.mockReturnValue(coordinatorUser)
    reviewService.getStatements.mockResolvedValue([
      { ...commonStatementData, isOverdue: false, isRemovalRequested: true },
    ])

    return request(app)
      .get('/10/view-statements')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('OVERDUE')
        expect(res.text).toContain('REMOVAL REQUEST')
        expect(res.text).toContain('View removal request')
      })
  })

  it('should display REMOVAL REQUEST badge and removal request link but not OVERDUE badge, because of overriding', () => {
    userSupplier.mockReturnValue(coordinatorUser)
    reviewService.getStatements.mockResolvedValue([
      { ...commonStatementData, isOverdue: true, isRemovalRequested: true },
    ])

    return request(app)
      .get('/10/view-statements')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('OVERDUE')
        expect(res.text).toContain('REMOVAL REQUEST')
        expect(res.text).toContain('View removal request')
      })
  })

  it('should not display REMOVAL REQUEST, OVERDUE or removal request link', () => {
    userSupplier.mockReturnValue(coordinatorUser)
    reviewService.getStatements.mockResolvedValue([
      { ...commonStatementData, isOverdue: false, isRemovalRequested: false },
    ])

    return request(app)
      .get('/10/view-statements')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('OVERDUE')
        expect(res.text).not.toContain('REMOVAL REQUEST')
        expect(res.text).not.toContain('View removal request')
      })
  })
})
