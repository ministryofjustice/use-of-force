const request = require('supertest')
const { appSetup, user, reviewerUser } = require('./testutils/appSetup')
const createRouter = require('./api')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const userSupplier = jest.fn()

const reportingService = {
  getMostOftenInvolvedStaff: jest.fn(),
  getMostOftenInvolvedPrisoners: jest.fn(),
}

const reportService = {
  isDraftInProgress: jest.fn(),
}

const offenderService = {
  getOffenderImage: jest.fn(),
}

const route = createRouter({
  authenticationMiddleware,
  offenderService,
  reportingService,
  reportService,
  systemToken: username => `${username}-system-token`,
})

let app

describe('api', () => {
  beforeEach(() => {
    offenderService.getOffenderImage.mockResolvedValue('')
    app = appSetup(route, userSupplier)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET /offender/:bookingId/image', () => {
    beforeEach(() => {
      userSupplier.mockReturnValue(user)
    })
    it('should render using user creds for non saved draft', async () => {
      reportService.isDraftInProgress.mockResolvedValue(false)
      await request(app)
        .get('/offender/1234/image')
        .expect('Content-Type', 'image/jpeg')
        .expect(() => {
          expect(offenderService.getOffenderImage).toBeCalledWith('token', '1234')
        })
    })
    it('should render using system creds for saved draft', async () => {
      reportService.isDraftInProgress.mockResolvedValue(true)
      await request(app)
        .get('/offender/1234/image')
        .expect('Content-Type', 'image/jpeg')
        .expect(() => {
          expect(offenderService.getOffenderImage).toBeCalledWith('user1-system-token', '1234')
        })
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

        expect(reportingService.getMostOftenInvolvedPrisoners).toBeCalledWith('user1-system-token', 'LEI', 10, 2019)
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
