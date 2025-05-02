import request from 'supertest'
import { paths } from '../../config/incident'
import { Report } from '../../data/incidentClientTypes'
import { appWithAllRoutes, adminUser, coordinatorUser, user } from '../__test/appSetup'
import ReviewService from '../../services/reviewService'
import OffenderService from '../../services/offenderService'
import AuthService from '../../services/authService'
import ReportService from '../../services/reportService'

jest.mock('../../services/authService')
jest.mock('../../services/reviewService')
jest.mock('../../services/offenderService')
jest.mock('../../services/reportService')

const reviewService = new ReviewService(null, null, null, null, null) as jest.Mocked<ReviewService>
const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>

let app
const flash = jest.fn()
const userSupplier = jest.fn()

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue('user1-system-token')
  app = appWithAllRoutes({ reportService, reviewService, offenderService, authService }, userSupplier, undefined, flash)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/:reportId/edit-report', () => {
  describe('GET /:reportId/edit-report', () => {
    test('should redirect to evidence form if admin', () => {
      userSupplier.mockReturnValue(adminUser)
      return request(app)
        .get(paths.editReport(-19))
        .expect('Content-Type', /text\/plain/)
        .expect(302)
        .expect('Location', paths.editForm(-19, 'evidence'))
    })

    test('should refuse access to coordinator', () => {
      userSupplier.mockReturnValue(coordinatorUser)
      return request(app)
        .get(paths.editReport(-19))
        .expect('Content-Type', /text\/html/)
        .expect(401)
    })

    test('should refuse access to normal user', () => {
      userSupplier.mockReturnValue(user)
      return request(app)
        .get(paths.editReport(-19))
        .expect('Content-Type', /text\/html/)
        .expect(401)
    })
  })

  describe('GET /:reportId/edit-form/:form', () => {
    beforeEach(() => {
      offenderService.getOffenderDetails.mockResolvedValue({})
      reviewService.getReport.mockResolvedValue({
        bookingId: '2',
        form: { evidence: { baggedEvidence: true } },
      } as Report)
    })

    test('should render form if admin', () => {
      userSupplier.mockReturnValue(adminUser)

      return request(app)
        .get(paths.editForm(-19, 'evidence'))
        .expect('Content-Type', /text\/html/)
        .expect(200)
        .expect(res => {
          expect(offenderService.getOffenderDetails).toHaveBeenCalledWith('user1-system-token', 2)
          expect(reviewService.getReport).toHaveBeenCalledWith(-19)

          expect(res.text).toContain('Edit report')
          expect(res.text).toContain('&quot;baggedEvidence&quot;: true')
        })
    })

    test('should render errors', () => {
      userSupplier.mockReturnValue(adminUser)
      flash.mockReturnValueOnce([{ href: '#form', text: 'Problem parsing json' }])

      return request(app)
        .get(paths.editForm(-19, 'evidence'))
        .expect('Content-Type', /text\/html/)
        .expect(200)
        .expect(res => {
          expect(offenderService.getOffenderDetails).toHaveBeenCalledWith('user1-system-token', 2)
          expect(reviewService.getReport).toHaveBeenCalledWith(-19)
          expect(res.text).toContain('Problem parsing json')
        })
    })

    test('should refuse access to coordinator', () => {
      userSupplier.mockReturnValue(coordinatorUser)
      return request(app)
        .get(paths.editForm(-19, 'evidence'))
        .expect('Content-Type', /text\/html/)
        .expect(401)
    })

    test('should refuse access to normal user', () => {
      userSupplier.mockReturnValue(user)
      return request(app)
        .get(paths.editForm(-19, 'evidence'))
        .expect('Content-Type', /text\/html/)
        .expect(401)
    })
  })

  describe('POST /:reportId/edit-form/:form', () => {
    it('should update form and redirect to same page', () => {
      userSupplier.mockReturnValue(adminUser)

      return request(app)
        .post(paths.editForm(-19, 'evidence'))
        .send({
          form: JSON.stringify({ evidence: { baggedEvidence: true } }),
        })
        .expect(302)
        .expect('Location', paths.editForm(-19, 'evidence'))
        .expect(() => {
          expect(reportService.update).toHaveBeenCalledWith(adminUser, -19, 'evidence', {
            evidence: {
              baggedEvidence: true,
            },
          })
          expect(flash).not.toHaveBeenCalled()
        })
    })

    it('should not accept invalid json as input', () => {
      userSupplier.mockReturnValue(adminUser)

      return request(app)
        .post(paths.editForm(-19, 'evidence'))
        .send({
          form: "this isn't json!",
        })
        .expect(302)
        .expect('Location', paths.editForm(-19, 'evidence'))
        .expect(() => {
          expect(reportService.update).not.toHaveBeenCalled()
          expect(flash).toHaveBeenCalledWith('errors', {
            href: '#form',
            text: "Unexpected token 'h', \"this isn't json!\" is not valid JSON",
          })
        })
    })

    test('should refuse access to coordinator', () => {
      userSupplier.mockReturnValue(coordinatorUser)
      return request(app)
        .post(paths.editForm(-19, 'evidence'))
        .expect('Content-Type', /text\/html/)
        .expect(401)
    })

    test('should refuse access to normal user', () => {
      userSupplier.mockReturnValue(user)
      return request(app)
        .post(paths.editForm(-19, 'evidence'))
        .expect('Content-Type', /text\/html/)
        .expect(401)
    })
  })
})
