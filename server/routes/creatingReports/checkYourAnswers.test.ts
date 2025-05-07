import request from 'supertest'
import { Prison } from '../../data/prisonClientTypes'
import LocationService from '../../services/locationService'
import OffenderService from '../../services/offenderService'
import NomisMappingService from '../../services/nomisMappingService'
import DraftReportService from '../../services/drafts/draftReportService'
import { appWithAllRoutes, user } from '../__test/appSetup'
import AuthService from '../../services/authService'

jest.mock('../../services/drafts/draftReportService')
jest.mock('../../services/offenderService')
jest.mock('../../services/locationService')
jest.mock('../../services/authService')
jest.mock('../../services/nomisMappingService')

const draftReportService = new DraftReportService(
  null,
  null,
  null,
  null,
  null,
  null,
  null
) as jest.Mocked<DraftReportService>
const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>
const locationService = new LocationService(null, null) as jest.Mocked<LocationService>
const nomisMappingService = new NomisMappingService(null) as jest.Mocked<NomisMappingService>
const authService = new AuthService(null) as jest.Mocked<AuthService>

nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId = jest.fn()
let app

beforeEach(() => {
  app = appWithAllRoutes({ draftReportService, offenderService, locationService, nomisMappingService, authService })
  draftReportService.getCurrentDraft.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })
  authService.getSystemClientToken.mockResolvedValue('user1-system-token')
  offenderService.getOffenderDetails.mockResolvedValue({})
  locationService.getLocation.mockResolvedValue('')
  locationService.getPrisonById.mockResolvedValue({ description: 'prison name' } as Prison)
  draftReportService.getInvolvedStaff.mockResolvedValue([])
  nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId.mockResolvedValue({
    nomisLocationId: 123456,
    dpsLocationId: '00000000-1111-2222-3333-444444444444',
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /check-your-answers', () => {
  it('Should get the dps location id if only the nomis location id is present', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })
    draftReportService.getCurrentDraft.mockResolvedValue({
      id: 1,
      form: { incidentDetails: { locationId: 123456 } },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect(res => {
        expect(nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId).toHaveBeenCalledWith(
          'user1-system-token',
          123456
        )
      })
  })

  it('Should get the incidentLocationId and update the the db', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })
    draftReportService.getCurrentDraft.mockResolvedValue({
      id: 1,
      form: { incidentDetails: { locationId: 123456 } },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect(res => {
        expect(draftReportService.updateLocationId).toHaveBeenCalled()
      })
  })

  it('Should not attempt get the dps location id if it is already present', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })
    draftReportService.getCurrentDraft.mockResolvedValue({
      id: 1,
      form: { incidentDetails: { incidentLocationId: '00000000-1111-2222-3333-444444444444' } },
    })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect(res => {
        expect(nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId).not.toHaveBeenCalled()
      })
  })
  it('Allow render if report is complete', () => {
    draftReportService.getReportStatus.mockReturnValue({ complete: true })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Check your answers')
        expect(offenderService.getOffenderDetails).toHaveBeenCalledWith('-35', 'user1')
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
        expect(res.text).not.toContain('Which pain inducing techniques were used against this prisoner?')
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
        expect(res.text).toContain('Which pain inducing techniques were used against this prisoner?')
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
        expect(res.text).toContain('Which pain inducing techniques were used against this prisoner?')
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
        expect(res.text).toContain('Which pain inducing techniques were used against this prisoner?')
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
    expect(draftReportService.submit).toHaveBeenCalledWith(user, -35)
  })

  it('An error is throw if the report is not complete', async () => {
    draftReportService.isDraftComplete.mockResolvedValue(false)

    await request(app).post('/report/-35/check-your-answers').expect(500)

    expect(draftReportService.submit).not.toHaveBeenCalledWith()
  })
})
