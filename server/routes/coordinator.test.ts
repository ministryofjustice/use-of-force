import request from 'supertest'
import { InvolvedStaff, Report } from '../data/incidentClientTypes'
import { InvolvedStaffService, OffenderService, ReportService, ReviewService } from '../services'
import { AddStaffResult } from '../services/involvedStaffService'
import { appWithAllRoutes, user, reviewerUser, coordinatorUser } from './testutils/appSetup'

jest.mock('../services/offenderService')
jest.mock('../services/reportService')
jest.mock('../services/involvedStaffService')
jest.mock('../services/reviewService')

const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>
const reportService = new ReportService(null, null, null) as jest.Mocked<ReportService>
const involvedStaffService = new InvolvedStaffService(null, null, null, null) as jest.Mocked<InvolvedStaffService>
const reviewService = new ReviewService(null, null, null, null, null) as jest.Mocked<ReviewService>

const userSupplier = jest.fn()

let app

describe('coordinator', () => {
  beforeEach(() => {
    app = appWithAllRoutes(
      {
        involvedStaffService,
        reportService,
        offenderService,
        reviewService,
      },
      userSupplier
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('view add involved staff', () => {
    it('should resolve for coordinator', async () => {
      userSupplier.mockReturnValue(coordinatorUser)

      await request(app)
        .get('/coordinator/report/1/add-staff')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Add another member of staff')
        })
    })

    it('should not resolve for reviewer', async () => {
      userSupplier.mockReturnValue(reviewerUser)

      await request(app)
        .get('/coordinator/report/1/add-staff')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })
    })

    it('should not resolve for user', async () => {
      userSupplier.mockReturnValue(user)

      await request(app)
        .get('/coordinator/report/1/add-staff')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })
    })
  })

  describe('submit add involved staff', () => {
    it('should resolve for coordinator', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      involvedStaffService.addInvolvedStaff.mockResolvedValue(AddStaffResult.SUCCESS)
      await request(app)
        .post('/coordinator/report/1/add-staff')
        .send({ username: 'sally' })
        .expect(302)
        .expect('Location', '/coordinator/report/1/add-staff/result/success')

      expect(involvedStaffService.addInvolvedStaff).toBeCalledWith('user1-system-token', '1', 'sally')
    })

    it('should not resolve for reviewer', async () => {
      userSupplier.mockReturnValue(reviewerUser)

      await request(app)
        .post('/coordinator/report/1/add-staff')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(involvedStaffService.addInvolvedStaff).not.toBeCalled()
    })

    it('should not resolve for user', async () => {
      userSupplier.mockReturnValue(user)

      await request(app)
        .post('/coordinator/report/1/add-staff')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(involvedStaffService.addInvolvedStaff).not.toBeCalled()
    })
  })

  describe('view add involved staff results', () => {
    it('should resolve for coordinator', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      involvedStaffService.addInvolvedStaff.mockResolvedValue(AddStaffResult.SUCCESS)
      await request(app)
        .get('/coordinator/report/1/add-staff/result/success')
        .expect(302)
        .expect('Location', '/1/view-report')
    })

    it('should not resolve for reviewer', async () => {
      userSupplier.mockReturnValue(reviewerUser)

      await request(app)
        .get('/coordinator/report/1/add-staff/result/success')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })
    })

    it('should not resolve for user', async () => {
      userSupplier.mockReturnValue(user)

      await request(app)
        .get('/coordinator/report/1/add-staff/result/success')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })
    })
  })

  describe('Confirm delete report', () => {
    it('should resolve for reviewer', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      offenderService.getOffenderDetails.mockResolvedValue({})
      reviewService.getReport.mockResolvedValue({} as Report)

      await request(app)
        .get('/coordinator/report/1/confirm-delete')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Are you sure you want to delete this report?')
        })
    })

    it('should not resolve for reviewer', async () => {
      userSupplier.mockReturnValue(reviewerUser)

      await request(app)
        .get('/coordinator/report/1/confirm-delete')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(involvedStaffService.addInvolvedStaff).not.toBeCalled()
    })

    it('should not resolve for user', async () => {
      userSupplier.mockReturnValue(user)

      await request(app)
        .get('/coordinator/report/1/confirm-delete')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(involvedStaffService.addInvolvedStaff).not.toBeCalled()
    })
  })

  describe('Delete report', () => {
    it('not confirming deletion triggers validation', async () => {
      userSupplier.mockReturnValue(coordinatorUser)

      await request(app)
        .post('/coordinator/report/123/delete')
        .expect(302)
        .expect('Location', '/coordinator/report/123/confirm-delete')
        .expect(() => {
          expect(reportService.deleteReport).not.toHaveBeenCalled()
        })
    })

    it('when report status is SUBMITTED and confirming to delete', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      reviewService.getReport.mockResolvedValue({ status: 'SUBMITTED' } as Report)

      await request(app)
        .post('/coordinator/report/123/delete')
        .send({ confirm: 'yes' })
        .expect(302)
        .expect('Location', '/not-completed-incidents')
        .expect(() => {
          expect(reportService.deleteReport).toHaveBeenCalledWith('user1', '123')
        })
    })

    it('when report status is SUBMITTED and confirming not to delete', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      reviewService.getReport.mockResolvedValue({ status: 'SUBMITTED' } as Report)

      await request(app)
        .post('/coordinator/report/123/delete')
        .send({ confirm: 'no' })
        .expect(302)
        .expect('Location', '/not-completed-incidents')
        .expect(() => {
          expect(reportService.deleteReport).not.toHaveBeenCalled()
        })
    })

    it('when report status is COMPLETE and confirming to delete', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      reviewService.getReport.mockResolvedValue({ status: 'COMPLETE' } as Report)

      await request(app)
        .post('/coordinator/report/123/delete')
        .send({ confirm: 'yes' })
        .expect(302)
        .expect('Location', '/completed-incidents')
        .expect(() => {
          expect(reportService.deleteReport).toHaveBeenCalledWith('user1', '123')
        })
    })

    it('when report status is COMPLETE and confirming not to delete', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      reviewService.getReport.mockResolvedValue({ status: 'COMPLETE' } as Report)

      await request(app)
        .post('/coordinator/report/123/delete')
        .send({ confirm: 'no' })
        .expect(302)
        .expect('Location', '/completed-incidents')
        .expect(() => {
          expect(reportService.deleteReport).not.toHaveBeenCalled()
        })
    })

    it('should not resolve for reviewer', async () => {
      userSupplier.mockReturnValue(reviewerUser)

      await request(app)
        .post('/coordinator/report/123/delete')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(reportService.deleteReport).not.toBeCalled()
    })

    it('should not resolve for user', async () => {
      userSupplier.mockReturnValue(user)

      await request(app)
        .post('/coordinator/report/123/delete')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(involvedStaffService.addInvolvedStaff).not.toBeCalled()
    })
  })

  describe('Confirm delete statement', () => {
    it('should resolve for reviewer', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      offenderService.getOffenderDetails.mockResolvedValue({})
      reviewService.getReport.mockResolvedValue({} as Report)
      involvedStaffService.loadInvolvedStaff.mockResolvedValue({ name: 'Bob' } as InvolvedStaff)

      await request(app)
        .get('/coordinator/report/1/statement/2/confirm-delete')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Are you sure you want to delete Bob?')
        })
    })

    it('should not resolve for reviewer', async () => {
      userSupplier.mockReturnValue(reviewerUser)

      await request(app)
        .get('/coordinator/report/1/statement/2/confirm-delete')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(involvedStaffService.removeInvolvedStaff).not.toBeCalled()
    })

    it('should not resolve for user', async () => {
      userSupplier.mockReturnValue(user)

      await request(app)
        .get('/coordinator/report/1/statement/2/confirm-delete')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(involvedStaffService.removeInvolvedStaff).not.toBeCalled()
    })
  })

  describe('Delete statement', () => {
    it('not confirming deletion triggers validation', async () => {
      userSupplier.mockReturnValue(coordinatorUser)

      await request(app)
        .post('/coordinator/report/123/statement/2/delete')
        .expect(302)
        .expect('Location', '/coordinator/report/123/statement/2/confirm-delete')
        .expect(() => {
          expect(involvedStaffService.removeInvolvedStaff).not.toHaveBeenCalled()
        })
    })

    it('when confirming to delete statement', async () => {
      userSupplier.mockReturnValue(coordinatorUser)

      await request(app)
        .post('/coordinator/report/123/statement/2/delete')
        .send({ confirm: 'yes' })
        .expect(302)
        .expect('Location', '/123/view-report')
        .expect(() => {
          expect(involvedStaffService.removeInvolvedStaff).toHaveBeenCalledWith('123', '2')
        })
    })

    it('when confirming not to delete statement', async () => {
      userSupplier.mockReturnValue(coordinatorUser)

      await request(app)
        .post('/coordinator/report/123/statement/2/delete')
        .send({ confirm: 'no' })
        .expect(302)
        .expect('Location', '/123/view-report')
        .expect(() => {
          expect(involvedStaffService.removeInvolvedStaff).not.toHaveBeenCalled()
        })
    })

    it('should not resolve for reviewer', async () => {
      userSupplier.mockReturnValue(reviewerUser)

      await request(app)
        .post('/coordinator/report/123/statement/2/delete')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(involvedStaffService.removeInvolvedStaff).not.toBeCalled()
    })

    it('should not resolve for user', async () => {
      userSupplier.mockReturnValue(user)

      await request(app)
        .post('/coordinator/report/123/statement/2/delete')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })

      expect(involvedStaffService.removeInvolvedStaff).not.toBeCalled()
    })
  })
})
