import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'

const userSupplier = jest.fn()

const reportService = {
  getReports: () => [],
  getReport: jest.fn(),
}

const offenderService = {
  getOffenderNames: () => [],
  getOffenderDetails: () => ({ displayName: 'Jimmy Choo', offenderNo: '123456' }),
}

const reportDetailBuilder = {
  build: async () => ({}),
}

let app

beforeEach(() => {
  userSupplier.mockReturnValue(user)
  app = appWithAllRoutes({ reportService, offenderService, reportDetailBuilder }, userSupplier)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /incidents', () => {
  it('should render page', () => request(app).get('/').expect(302).expect('Location', '/your-statements'))
})

describe('GET /your-reports', () => {
  it('should render page', () =>
    request(app)
      .get('/your-reports')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
      }))
})

describe('GET /your-report', () => {
  it('should render page', () => {
    reportService.getReport.mockReturnValue({ id: 1, form: { incidentDetails: {} } })
    return request(app)
      .get('/1/your-report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force report')
      })
  })
})