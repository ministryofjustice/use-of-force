const request = require('supertest')
const { appSetup, user, reviewerUser } = require('./testutils/appSetup')
const createRouter = require('./api')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const userSupplier = jest.fn()

const reportingService = {
  getMostOftenInvolvedStaff: jest.fn(),
  getMostOftenInvolvedPrisoners: jest.fn(),
}

const route = createRouter({ authenticationMiddleware, reportingService })

let app

describe('api', () => {
  beforeEach(() => {
    app = appSetup(route, userSupplier)
    reportingService.getMostOftenInvolvedStaff.mockResolvedValue('Some,Csv,Content for involved staff')
    reportingService.getMostOftenInvolvedPrisoners.mockResolvedValue('Some,Csv,Content for prisoners')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET /reports/mostOftenInvolvedStaff/:agencyId/:year/:month', () => {
    it('should render for reviewer', async () => {
      userSupplier.mockReturnValue(reviewerUser)

      await request(app)
        .get('/reports/mostOftenInvolvedStaff/LEI/2019/10')
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-Disposition', `attachment; filename="involved-staff-LEI-10-2019.csv"`)
        .expect(res => {
          expect(res.text).toContain('Some,Csv,Content for involved staff')
        })

      expect(reportingService.getMostOftenInvolvedStaff).toBeCalledWith('LEI', 10, 2019)
    })

    it('should not render for standard user', async () => {
      userSupplier.mockReturnValue(user)

      await request(app)
        .get('/reports/mostOftenInvolvedStaff/LEI/2019/10')
        .expect('Content-Type', /text\/html/)
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(reportingService.getMostOftenInvolvedStaff).not.toBeCalled()
    })
  })

  describe('GET /reports/mostOftenInvolvedPrisoners/:agencyId/:year/:month', () => {
    it('should render for reviewer', async () => {
      userSupplier.mockReturnValue(reviewerUser)

      await request(app)
        .get('/reports/mostOftenInvolvedPrisoners/LEI/2019/10')
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-Disposition', `attachment; filename="prisoners-LEI-10-2019.csv"`)
        .expect(res => {
          expect(res.text).toContain('Some,Csv,Content for prisoners')
        })

      expect(reportingService.getMostOftenInvolvedPrisoners).toBeCalledWith('token', 'LEI', 10, 2019)
    })

    it('should not render for standard user', async () => {
      userSupplier.mockReturnValue(user)

      await request(app)
        .get('/reports/mostOftenInvolvedPrisoners/LEI/2019/10')
        .expect('Content-Type', /text\/html/)
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(reportingService.getMostOftenInvolvedPrisoners).not.toBeCalled()
    })
  })
})
