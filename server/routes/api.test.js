const request = require('supertest')
const { appSetup, user, reviewerUser, coordinatorUser } = require('./testutils/appSetup')
const createRouter = require('./api')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const userSupplier = jest.fn()

const reportingService = {
  getMostOftenInvolvedStaff: jest.fn(),
  getMostOftenInvolvedPrisoners: jest.fn(),
  getIncidentsOverview: jest.fn(),
  getIncidentHeatmap: jest.fn(),
  getIncidentsByReligiousGroup: jest.fn(),
  getIncidentsByAgeGroup: jest.fn(),
}

const offenderService = {
  getOffenderImage: jest.fn(),
}

const route = createRouter(authenticationMiddleware, {
  offenderService,
  reportingService,
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
    it('should render using system creds for retrieving image', async () => {
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
      reportingService.getIncidentsOverview.mockResolvedValue('Some,Csv,Content for prisoners')
      reportingService.getIncidentHeatmap.mockResolvedValue('Some,Csv,Content for prisoners')
      reportingService.getIncidentsByReligiousGroup.mockResolvedValue('A,B,C\n1,2,3\n')
      reportingService.getIncidentsByAgeGroup.mockResolvedValue('X,Y,Z\n3,4,5\n')
    })
    describe('GET /reports/mostOftenInvolvedStaff/:year/:month', () => {
      it('should render for coordinator', async () => {
        userSupplier.mockReturnValue(coordinatorUser)

        await request(app)
          .get('/reports/mostOftenInvolvedStaff/2019/10')
          .expect('Content-Type', /text\/csv/)
          .expect('Content-Disposition', `attachment; filename="involved-staff-LEI-10-2019.csv"`)
          .expect(res => {
            expect(res.text).toContain('Some,Csv,Content for involved staff')
          })

        expect(reportingService.getMostOftenInvolvedStaff).toBeCalledWith('LEI', 10, 2019)
      })

      it('should not render for reviewer', async () => {
        userSupplier.mockReturnValue(reviewerUser)

        await request(app)
          .get('/reports/mostOftenInvolvedStaff/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getMostOftenInvolvedStaff).not.toBeCalled()
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
      it('should render for coordinator', async () => {
        userSupplier.mockReturnValue(coordinatorUser)

        await request(app)
          .get('/reports/mostOftenInvolvedPrisoners/2019/10')
          .expect('Content-Type', /text\/csv/)
          .expect('Content-Disposition', `attachment; filename="prisoners-LEI-10-2019.csv"`)
          .expect(res => {
            expect(res.text).toContain('Some,Csv,Content for prisoners')
          })

        expect(reportingService.getMostOftenInvolvedPrisoners).toBeCalledWith('user1-system-token', 'LEI', 10, 2019)
      })

      it('should not render for reviewer', async () => {
        userSupplier.mockReturnValue(reviewerUser)

        await request(app)
          .get('/reports/mostOftenInvolvedPrisoners/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getMostOftenInvolvedPrisoners).not.toBeCalled()
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

    describe('GET /reports/overview/:year/:month', () => {
      it('should render for coordinator', async () => {
        userSupplier.mockReturnValue(coordinatorUser)

        await request(app)
          .get('/reports/overview/2019/10')
          .expect('Content-Type', /text\/csv/)
          .expect('Content-Disposition', `attachment; filename="overview-LEI-10-2019.csv"`)
          .expect(res => {
            expect(res.text).toContain('Some,Csv,Content for prisoners')
          })

        expect(reportingService.getIncidentsOverview).toBeCalledWith('LEI', 10, 2019)
      })

      it('should not render for reviewer', async () => {
        userSupplier.mockReturnValue(reviewerUser)

        await request(app)
          .get('/reports/overview/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getIncidentsOverview).not.toBeCalled()
      })

      it('should not render for standard user', async () => {
        userSupplier.mockReturnValue(user)

        await request(app)
          .get('/reports/overview/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getIncidentsOverview).not.toBeCalled()
      })
    })

    describe('GET /reports/heatmap/:year/:month', () => {
      it('should render for coordinator', async () => {
        userSupplier.mockReturnValue(coordinatorUser)

        await request(app)
          .get('/reports/heatmap/2019/10')
          .expect('Content-Type', /text\/csv/)
          .expect('Content-Disposition', `attachment; filename="heatmap-LEI-10-2019.csv"`)
          .expect(res => {
            expect(res.text).toContain('Some,Csv,Content for prisoners')
          })

        expect(reportingService.getIncidentHeatmap).toBeCalledWith('user1-system-token', 'LEI', 10, 2019)
      })

      it('should not render for reviewer', async () => {
        userSupplier.mockReturnValue(reviewerUser)

        await request(app)
          .get('/reports/heatmap/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getIncidentHeatmap).not.toBeCalled()
      })

      it('should not render for standard user', async () => {
        userSupplier.mockReturnValue(user)

        await request(app)
          .get('/reports/heatmap/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getIncidentHeatmap).not.toBeCalled()
      })
    })

    describe('GET /reports/incidentsByReligion/:year/:month', () => {
      it('should render for coordinator', async () => {
        userSupplier.mockReturnValue(coordinatorUser)

        await request(app)
          .get('/reports/incidentsByReligion/2019/10')
          .expect('Content-Type', /text\/csv/)
          .expect('Content-Disposition', `attachment; filename="religion-LEI-10-2019.csv"`)
          .expect(res => {
            expect(res.text).toContain('A,B,C\n1,2,3\n')
          })

        expect(reportingService.getIncidentsByReligiousGroup).toBeCalledWith('user1-system-token', 'LEI', 10, 2019)
      })

      it('should not render for reviewer', async () => {
        userSupplier.mockReturnValue(reviewerUser)

        await request(app)
          .get('/reports/incidentsByReligion/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getIncidentsByReligiousGroup).not.toBeCalled()
      })

      it('should not render for standard user', async () => {
        userSupplier.mockReturnValue(user)

        await request(app)
          .get('/reports/incidentsByReligion/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getIncidentsByReligiousGroup).not.toBeCalled()
      })
    })
    describe('GET /reports/incidentsByAgeGroup/:year/:month', () => {
      it('should render for coordinator', async () => {
        userSupplier.mockReturnValue(coordinatorUser)

        await request(app)
          .get('/reports/incidentsByAgeGroup/2019/10')
          .expect('Content-Type', /text\/csv/)
          .expect('Content-Disposition', `attachment; filename="age-LEI-10-2019.csv"`)
          .expect(res => {
            expect(res.text).toContain('X,Y,Z\n3,4,5\n')
          })

        expect(reportingService.getIncidentsByAgeGroup).toBeCalledWith('user1-system-token', 'LEI', 10, 2019)
      })

      it('should not render for reviewer', async () => {
        userSupplier.mockReturnValue(reviewerUser)

        await request(app)
          .get('/reports/incidentsByAgeGroup/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getIncidentsByAgeGroup).not.toBeCalled()
      })
      it('should not render for standard user', async () => {
        userSupplier.mockReturnValue(user)

        await request(app)
          .get('/reports/incidentsByAgeGroup/2019/10')
          .expect('Content-Type', /text\/html/)
          .expect(401)
          .expect(res => {
            expect(res.text).toContain('Not authorised to access this resource')
          })

        expect(reportingService.getIncidentsByAgeGroup).not.toBeCalled()
      })
    })
  })
})
