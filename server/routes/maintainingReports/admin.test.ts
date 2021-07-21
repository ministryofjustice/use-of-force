import request from 'supertest'
import { paths } from '../../config/incident'
import { Report } from '../../data/incidentClientTypes'
import { OffenderService, ReportService, ReviewService } from '../../services'
import { appWithAllRoutes, adminUser, coordinatorUser, user } from '../__test/appSetup'

jest.mock('../../services')

const reviewService = new ReviewService(null, null, null, null, null) as jest.Mocked<ReviewService>
const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>
const reportService = new ReportService(null, null, null, null, null, null, null) as jest.Mocked<ReportService>

let app
const flash = jest.fn()
const userSupplier = jest.fn()

beforeEach(() => {
  app = appWithAllRoutes({ reportService, reviewService, offenderService }, userSupplier, undefined, flash)
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
        bookingId: 2,
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

    it('should redirect to select primary reason page when more than one reason selected', () => {
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
            text: 'Unexpected token h in JSON at position 1',
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
