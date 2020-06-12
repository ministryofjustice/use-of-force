const request = require('supertest')
const { appWithAllRoutes, user } = require('./testutils/appSetup')

const reportService = {
  getCurrentDraft: jest.fn(),
  isDraftComplete: jest.fn(),
  submit: jest.fn(),
  getReportStatus: jest.fn(),
}

const offenderService = {
  getOffenderDetails: jest.fn(),
}

const involvedStaffService = {
  getDraftInvolvedStaff: () => [],
}

const locationService = {
  getPrisonById: jest.fn(),
  getLocation: jest.fn(),
}

let app

beforeEach(() => {
  app = appWithAllRoutes({ reportService, offenderService, involvedStaffService, locationService })
  reportService.getCurrentDraft.mockResolvedValue({ form: { incidentDetails: {} } })

  offenderService.getOffenderDetails.mockResolvedValue({})
  locationService.getLocation.mockResolvedValue({})
  locationService.getPrisonById.mockResolvedValue({ description: 'prison name' })
})

describe('GET /check-your-answers', () => {
  it('Allow render if report is complete', () => {
    reportService.getReportStatus.mockReturnValue({ complete: true })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Check your answers')
        expect(offenderService.getOffenderDetails).toHaveBeenCalledWith('user1-system-token', -35)
      })
  })

  it('Should not contain the pain inducing techniques question [pain inducing techniques = undefined]', () => {
    reportService.getReportStatus.mockReturnValue({ complete: true })
    reportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {},
        useOfForceDetails: {
          pavaDrawn: false,
          restraint: false,
          batonDrawn: false,
          guidingHold: false,
          handcuffsApplied: false,
          positiveCommunication: false,
          personalProtectionTechniques: false,
        },
      },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Were pain inducing techniques used?')
      })
  })

  it('Should contain the pain inducing techniques question [pain inducing techniques = true]', () => {
    reportService.getReportStatus.mockReturnValue({ complete: true })
    reportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {},
        useOfForceDetails: {
          pavaDrawn: false,
          restraint: false,
          batonDrawn: false,
          guidingHold: false,
          handcuffsApplied: false,
          positiveCommunication: false,
          painInducingTechniques: true,
          personalProtectionTechniques: false,
        },
      },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Were pain inducing techniques used?')
      })
  })

  it('Should contain the pain inducing techniques question [pain inducing techniques = false]', () => {
    reportService.getReportStatus.mockReturnValue({ complete: true })
    reportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {},
        useOfForceDetails: {
          pavaDrawn: false,
          restraint: false,
          batonDrawn: false,
          guidingHold: false,
          handcuffsApplied: false,
          positiveCommunication: false,
          painInducingTechniques: false,
          personalProtectionTechniques: false,
        },
      },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Were pain inducing techniques used?')
      })
  })

  it('Should contain prisoner compliant', () => {
    reportService.getReportStatus.mockReturnValue({ complete: true })
    reportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {},
        useOfForceDetails: {},
        evidence: {},
        relocationAndInjuries: {
          relocationCompliancy: true,
        },
      },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Was the prisoner compliant?')
      })
  })

  it('Should contain vehicle', () => {
    reportService.getReportStatus.mockReturnValue({ complete: true })
    reportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {},
        relocationAndInjuries: {
          relocationCompliancy: false,
          relocationType: 'VEHICLE',
        },
      },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('No - relocated to vehicle')
      })
  })

  it('Redirect if report is not complete', () => {
    reportService.getReportStatus.mockReturnValue({ complete: false })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(302)
      .expect('Location', '/')
  })

  it('Should contain the prison where the incident took place', () => {
    reportService.getReportStatus.mockReturnValue({ complete: true })
    locationService.getPrisonById.mockResolvedValue({ description: 'Sheffield' })
    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prison')
      })
      .expect(res => {
        expect(res.text).toContain('Sheffield')
      })
  })
})

describe('POST /check-your-answers', () => {
  it('Allow submit if report is complete', async () => {
    reportService.isDraftComplete.mockReturnValue(true)
    reportService.submit.mockReturnValue(2)

    await request(app)
      .post('/report/-35/check-your-answers')
      .expect(302)
      .expect('Location', '/2/report-sent')
    expect(reportService.submit).toBeCalledWith(user, '-35')
  })

  it('An error is throw if the report is not complete', async () => {
    reportService.isDraftComplete.mockReturnValue(false)

    await request(app)
      .post('/report/-35/check-your-answers')
      .expect(500)

    expect(reportService.submit).not.toBeCalledWith()
  })
})
