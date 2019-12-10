const request = require('supertest')
const { appSetup, user, reviewerUser } = require('./testutils/appSetup')
const createRouter = require('./api')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const userSupplier = jest.fn()

const reportingService = {
  getMostOftenInvolvedStaff: jest.fn(),
  getMostOftenInvolvedPrisoners: jest.fn(),
}

const involvedStaffService = {
  addInvolvedStaff: jest.fn(),
}

const route = createRouter({ authenticationMiddleware, reportingService, involvedStaffService })

let app

describe('api', () => {
  beforeEach(() => {
    app = appSetup(route, userSupplier)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('add involved staff', () => {
    it('should resolve for reviewer', async () => {
      userSupplier.mockReturnValue(reviewerUser)

      await request(app)
        .get('/report/1/involved-staff/sally')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(res => {
          expect(res.body).toEqual({ result: 'ok' })
        })

      expect(involvedStaffService.addInvolvedStaff).toBeCalledWith('token', '1', 'sally')
    })

    it('should not resolve for reviewer', async () => {
      userSupplier.mockReturnValue(user)

      await request(app)
        .get('/report/1/involved-staff/sally')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(involvedStaffService.addInvolvedStaff).not.toBeCalled()
    })
  })

  describe('reporting', () => {
    beforeEach(() => {
      reportingService.getMostOftenInvolvedStaff.mockResolvedValue('Some,Csv,Content for involved staff')
      reportingService.getMostOftenInvolvedPrisoners.mockResolvedValue('Some,Csv,Content for prisoners')
    })
    describe('GET /reports/mostOftenInvolvedStaff/:year/:month', () => {
      it('should render for reviewer', async () => {
        userSupplier.mockReturnValue(reviewerUser)

        await request(app)
          .get('/reports/mostOftenInvolvedStaff/2019/10')
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
          .get('/reports/mostOftenInvolvedStaff/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getMostOftenInvolvedStaff).not.toBeCalled()
      })
    })

    describe('GET /reports/mostOftenInvolvedPrisoners/:year/:month', () => {
      it('should render for reviewer', async () => {
        userSupplier.mockReturnValue(reviewerUser)

        await request(app)
          .get('/reports/mostOftenInvolvedPrisoners/2019/10')
          .expect('Content-Type', 'text/csv; charset=utf-8')
          .expect('Content-Disposition', `attachment; filename="prisoners-LEI-10-2019.csv"`)
          .expect(res => {
            expect(res.text).toContain('Some,Csv,Content for prisoners')
          })

        expect(reportingService.getMostOftenInvolvedPrisoners).toBeCalledWith('user1', 'LEI', 10, 2019)
      })

      it('should not render for standard user', async () => {
        userSupplier.mockReturnValue(user)

        await request(app)
          .get('/reports/mostOftenInvolvedPrisoners/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getMostOftenInvolvedPrisoners).not.toBeCalled()
      })
    })
  })
})
