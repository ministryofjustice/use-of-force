const request = require('supertest')
const { appWithAllRoutes, user, reviewerUser, coordinatorUser } = require('./testutils/appSetup')

const userSupplier = jest.fn()

const involvedStaffService = {
  addInvolvedStaff: jest.fn(),
  removeInvolvedStaff: jest.fn(),
  loadInvolvedStaff: jest.fn(),
}
const reportService = {
  deleteReport: jest.fn(),
}
const offenderService = {
  getOffenderDetails: jest.fn(),
}
const reviewService = {
  getReport: jest.fn(),
}

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
      involvedStaffService.addInvolvedStaff.mockResolvedValue('success')
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
      involvedStaffService.addInvolvedStaff.mockResolvedValue('success')
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
      offenderService.getOffenderDetails.mockReturnValue({})
      reviewService.getReport.mockReturnValue({})

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

    it('when confirming to delete', async () => {
      userSupplier.mockReturnValue(coordinatorUser)

      await request(app)
        .post('/coordinator/report/123/delete')
        .send({ confirm: 'yes', referingPageTab: 'not-completed-incidents' })
        .expect(302)
        .expect('Location', '/not-completed-incidents')
        .expect(() => {
          expect(reportService.deleteReport).toHaveBeenCalledWith('user1', '123')
        })
    })

    it('when confirming not to delete', async () => {
      userSupplier.mockReturnValue(coordinatorUser)

      await request(app)
        .post('/coordinator/report/123/delete')
        .send({ confirm: 'no', referingPageTab: 'not-completed-incidents' })
        .expect(302)
        .expect('Location', '/not-completed-incidents')
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
      offenderService.getOffenderDetails.mockReturnValue({})
      reviewService.getReport.mockReturnValue({})
      involvedStaffService.loadInvolvedStaff.mockResolvedValue({ name: 'Bob' })

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
