import request from 'supertest'
import { InvolvedStaffService } from '../../services/involvedStaffService'
import { appWithAllRoutes, user, reviewerUser, coordinatorUser } from '../__test/appSetup'
import ReportService from '../../services/reportService'
import OffenderService from '../../services/offenderService'
import ReviewService, { ReviewerStatementWithComments } from '../../services/reviewService'
import UserService from '../../services/userService'
import StatementService from '../../services/statementService'
import AuthService from '../../services/authService'
import LocationService from '../../services/locationService'
import ReportDetailBuilder, { ReportDetail } from '../../services/reportDetailBuilder'
import ReportEditService from '../../services/reportEditService'

jest.mock('../../services/authService')
jest.mock('../../services/offenderService')
jest.mock('../../services/reportService')
jest.mock('../../services/involvedStaffService')
jest.mock('../../services/reviewService')
jest.mock('../../services/userService')
jest.mock('../../services/statementService')
jest.mock('../../services/locationService')
jest.mock('../../services/reportDetailBuilder')
jest.mock('../../services/reportEditService')
jest.mock('../../../log')

const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>
const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>
const involvedStaffService = new InvolvedStaffService(
  null,
  null,
  null,
  null,
  null,
  null
) as jest.Mocked<InvolvedStaffService>
const reviewService = new ReviewService(null, null, null, null, null) as jest.Mocked<ReviewService>
const userService = new UserService(null, null) as jest.Mocked<UserService>
const statementService = new StatementService(null, null, null) as jest.Mocked<StatementService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const locationService = new LocationService(null, null) as jest.Mocked<LocationService>
const reportDetailBuilder = new ReportDetailBuilder(null, null, null, null, null) as jest.Mocked<ReportDetailBuilder>
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
const userSupplier = jest.fn()

let app
const flash = jest.fn()

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue('user1-system-token')
  userSupplier.mockReturnValue(coordinatorUser)
  reportDetailBuilder.build.mockResolvedValue({} as ReportDetail)
  reviewService.getStatements.mockResolvedValue([] as ReviewerStatementWithComments[])
  locationService.getPrisons.mockResolvedValue([
    {
      agencyId: 'ABC',
      description: 'Prison ABC',
      agencyType: 'INST',
      active: true,
    },
    {
      agencyId: 'DEF',
      description: 'Prison DEF',
      agencyType: 'INST',
      active: true,
    },
  ])

  // Always allow edit/delete for coordinator in these tests
  reportEditService.isTodaysDateWithinEditabilityPeriod.mockResolvedValue(true)

  app = appWithAllRoutes(
    {
      involvedStaffService,
      reportService,
      offenderService,
      reviewService,
      userService,
      statementService,
      authService,
      locationService,
      reportDetailBuilder,
      reportEditService,
    },
    userSupplier,
    false,
    flash
  )
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('coordinator authorisation', () => {
  describe('viewEditReport', () => {
    it('should allow coordinator to access page', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      await request(app).get('/1/edit-report').expect(200).expect('Content-Type', 'text/html; charset=utf-8')
    })

    it('should not allow reviewer to access page', async () => {
      userSupplier.mockReturnValue(reviewerUser)
      await request(app)
        .get('/1/edit-report')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })
    })

    it('should not allow user (i.e not coordinator/reviewerUser) to access page', async () => {
      userSupplier.mockReturnValue(user)
      await request(app)
        .get('/1/edit-report')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })
    })
  })

  describe('viewEditPrison', () => {
    it('should allow coordinator to access page', async () => {
      await request(app).get('/1/edit-report/prison').expect(200).expect('Content-Type', 'text/html; charset=utf-8')
    })

    it('should not allow reviewer to access page', async () => {
      userSupplier.mockReturnValue(reviewerUser)
      await request(app)
        .get('/1/edit-report/prison')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })
    })

    it('should not allow user (i.e not coordinator/reviewerUser) to access page', async () => {
      userSupplier.mockReturnValue(user)
      await request(app)
        .get('/1/edit-report/prison')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })
    })

    it('page response should include error data', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      flash.mockReturnValue([
        {
          text: 'What prison did the use of force take place in?',
          href: '#agencyId',
        },
      ])
      await request(app)
        .get('/1/edit-report/prison')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('What prison did the use of force take place in')
        })
    })
  })

  describe('submitEditPrison', () => {
    it('should redirect to next page with correct query parameters', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      await request(app)
        .post('/1/edit-report/prison')
        .send({ agencyId: 'ABC' })
        .expect(302)
        .expect('Location', '/1/edit-report/incident-details?new-prison=ABC')
    })
  })
})
