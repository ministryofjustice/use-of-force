import moment from 'moment'
import request from 'supertest'
import { ReportService, LocationService, OffenderService } from '../../services'
import { appWithAllRoutes } from '../__test/appSetup'

jest.mock('../../services/offenderService')
jest.mock('../../services/reportService')
jest.mock('../../services/locationService')

const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>
const locationService = new LocationService(null) as jest.Mocked<LocationService>
const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>

let app

beforeEach(() => {
  app = appWithAllRoutes({ reportService, locationService, offenderService })
  offenderService.getOffenderDetails.mockResolvedValue({})
  reportService.getReportInProgress.mockResolvedValue({ id: null, incidentdate: null })
  locationService.getLocation.mockResolvedValue({})
  reportService.getReportsByDate.mockResolvedValue([])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/report-may-already-exist', () => {
  describe('GET', () => {
    it('should get offender name', () => {
      return request(app)
        .get('/report/2/report-may-already-exist')
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(offenderService.getOffenderDetails).toBeCalledTimes(1)
          expect(offenderService.getOffenderDetails).toBeCalledWith('user1-system-token', 2)
        })
    })

    it('should get in-progress report', () => {
      return request(app)
        .get('/report/3/report-may-already-exist')
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(reportService.getReportInProgress).toBeCalledTimes(1)
          expect(reportService.getReportInProgress).toBeCalledWith(3)
        })
    })

    it('should redirect if no in-progress report', () => {
      reportService.getReportInProgress.mockResolvedValue(null)
      return request(app)
        .get('/report/3/report-may-already-exist')
        .expect(302)
        .expect('Location', '/report/3/report-has-been-deleted')
    })

    it('should get reports that have same incident date as the new in-progress report', () => {
      reportService.getReportInProgress.mockResolvedValue({ id: 15, incidentdate: '10/07/2021' })
      return request(app)
        .get('/report/3/report-may-already-exist')
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(reportService.getReportInProgress).toBeCalledTimes(1)
          expect(reportService.getReportsByDate).toBeCalledWith(3, '10/07/2021')
        })
    })

    it('should render page content', () => {
      offenderService.getOffenderDetails.mockResolvedValue({ displayName: 'Erik Furtney' })
      locationService.getLocation.mockResolvedValue({ userDescription: 'Location 1' })
      reportService.getReportsByDate.mockResolvedValue([
        {
          date: moment('10/07/2021', 'DDMMYYYY'),
          form: { incidentDetails: { locationId: 'room 1' } },
          reporter: 'Prison Officer One',
          status: 'SUBMITTED',
        },
        {
          date: moment('10/07/2021', 'DDMMYYYY'),
          form: { incidentDetails: { locationId: 'room 2' } },
          reporter: 'Prison Officer Two',
          status: 'SUBMITTED',
        },
      ])

      return request(app)
        .get('/report/1/report-may-already-exist')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('A report for this incident may already exist')
          expect(res.text).toContain('Erik Furtney')
          expect(res.text).toContain('Saturday 10 Jul 2021, 00:00')
          expect(res.text).toContain('Prison Officer One')
          expect(res.text).toContain('Prison Officer Two')
          expect(res.text).toContain('Location 1')
        })
    })

    it('should render radios plus save and continue button', () => {
      return request(app)
        .get('/report/1/report-may-already-exist')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain(
            '<input class="govuk-radios__input" id="cancel-report-yes" name="cancelReport" type="radio" value="true" data-qa="yes">'
          )
          expect(res.text).toContain(
            '<input class="govuk-radios__input" id="no" name="cancelReport" type="radio" value="false" data-qa="no">'
          )
          expect(res.text).toMatch(/<button value="save-and-continue"/)
        })
    })
  })

  describe('POST', () => {
    it('should redirect to same page as user not selected either radio', () => {
      reportService.getReportInProgress.mockResolvedValue({ id: 1, incidentdate: '' })
      return request(app)
        .post('/report/1/report-may-already-exist')
        .send({ cancelReport: undefined })
        .expect(302)
        .expect('Location', '/report/1/report-may-already-exist')
    })
    it('should redirect to report-cancelled', () => {
      reportService.getReportInProgress.mockResolvedValue({ id: 1, incidentdate: '' })
      return request(app)
        .post('/report/1/report-may-already-exist')
        .send({ cancelReport: 'true' })
        .expect(302)
        .expect('Location', '/report/1/report-cancelled')
    })

    it('should redirect to tasklist as user did not select save-and-continue button', () => {
      reportService.getReportInProgress.mockResolvedValue({ id: 1, incidentdate: '' })
      return request(app)
        .post('/report/1/report-may-already-exist')
        .send({ cancelReport: 'false' })
        .expect(302)
        .expect('Location', '/report/1/report-use-of-force')
    })
  })
})
