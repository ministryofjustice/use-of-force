import request from 'supertest'
import { Prison } from '../../data/prisonClientTypes'
import LocationService from '../../services/locationService'
import OffenderService from '../../services/offenderService'
import DraftReportService from '../../services/drafts/draftReportService'
import { appWithAllRoutes, user } from '../__test/appSetup'

jest.mock('../../services/drafts/draftReportService')
jest.mock('../../services/offenderService')
jest.mock('../../services/locationService')

const draftReportService = new DraftReportService(
  null,
  null,
  null,
  null,
  null,
  null,
  null
) as jest.Mocked<DraftReportService>
const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>
const locationService = new LocationService(null) as jest.Mocked<LocationService>

let app

beforeEach(() => {
  app = appWithAllRoutes({ draftReportService, offenderService, locationService })
  draftReportService.getCurrentDraft.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })

  offenderService.getOffenderDetails.mockResolvedValue({})
  locationService.getLocation.mockResolvedValue('')
  locationService.getPrisonById.mockResolvedValue({ description: 'prison name' } as Prison)
  draftReportService.getInvolvedStaff.mockResolvedValue([])
})

describe('GET /check-your-answers', () => {
  it('Allow render if report is complete', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })

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
    draftReportService.getReportStatus.mockReturnValue({ complete: true })
    draftReportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {},
        useOfForceDetails: {
          pavaDrawnAgainstPrisoner: false,
          batonDrawnAgainstPrisoner: false,
          guidingHold: false,
          escortingHold: false,
          handcuffsApplied: false,
          positiveCommunication: false,
          personalProtectionTechniques: false,
          restraintPositions: 'NONE',
          painInducingTechniques: undefined,
        },
      },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Which pain inducing techniques were used?')
      })
  })

  it('Should contain the pain inducing techniques question [pain inducing techniques = true]', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })
    draftReportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {},
        useOfForceDetails: {
          pavaDrawnAgainstPrisoner: false,
          batonDrawnAgainstPrisoner: false,
          guidingHold: false,
          handcuffsApplied: false,
          positiveCommunication: false,
          painInducingTechniques: true,
          personalProtectionTechniques: false,
          restraintPositions: 'NONE',
        },
      },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Which pain inducing techniques were used?')
      })
  })

  it('Should contain the pain inducing techniques question [pain inducing techniques = false]', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })
    draftReportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {},
        useOfForceDetails: {
          pavaDrawnAgainstPrisoner: false,
          batonDrawnAgainstPrisoner: false,
          guidingHold: false,
          handcuffsApplied: false,
          positiveCommunication: false,
          painInducingTechniques: false,
          personalProtectionTechniques: false,
          restraintPositions: 'NONE',
        },
      },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Which pain inducing techniques were used?')
      })
  })

  it('Should contain the pain inducing techniques question [pain inducing techniques is undefined but techniques listed]', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })
    draftReportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {},
        useOfForceDetails: {
          pavaDrawnAgainstPrisoner: false,
          batonDrawnAgainstPrisoner: false,
          guidingHold: false,
          handcuffsApplied: false,
          positiveCommunication: false,
          painInducingTechniquesUsed: 'NONE',
          personalProtectionTechniques: false,
          restraintPositions: 'NONE',
        },
      },
    })
    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Which pain inducing techniques were used?')
      })
  })
  it('Should contain prisoner compliant', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })
    draftReportService.getCurrentDraft.mockResolvedValue({
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

  it('Should contain NTRG in correct case', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })
    draftReportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {},
        relocationAndInjuries: {
          relocationCompliancy: false,
          relocationType: 'NTRG',
        },
      },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('No - Handed to local staff (NTRG)')
      })
  })

  it('Redirect if report is not complete', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: false })

    return request(app).get('/report/-35/check-your-answers').expect(302).expect('Location', '/')
  })

  it('Should contain the prison where the incident took place', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })
    locationService.getPrisonById.mockResolvedValue({ description: 'Sheffield' } as Prison)
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

  it('Should match location format', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })
    locationService.getLocation.mockResolvedValue('VCC Visits')
    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('VCC Visits')
      })
  })
})

describe('POST /check-your-answers', () => {
  it('Allow submit if report is complete', async () => {
    draftReportService.isDraftComplete.mockResolvedValue(true)
    draftReportService.submit.mockResolvedValue(2)

    await request(app).post('/report/-35/check-your-answers').expect(302).expect('Location', '/2/report-sent')
    expect(draftReportService.submit).toBeCalledWith(user, -35)
  })

  it('An error is throw if the report is not complete', async () => {
    draftReportService.isDraftComplete.mockResolvedValue(false)

    await request(app).post('/report/-35/check-your-answers').expect(500)

    expect(draftReportService.submit).not.toBeCalledWith()
  })
})
