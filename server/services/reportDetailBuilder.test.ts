import { Prison } from '../data/prisonClientTypes'
import { InvolvedStaff, Report } from '../data/incidentClientTypes'
import ReportDetailBuilder from './reportDetailBuilder'
import { UseOfForceReport } from '../data/UseOfForceReport'
import AuthService from './authService'
import { InvolvedStaffService } from './involvedStaffService'
import LocationService from './locationService'
import OffenderService from './offenderService'
import NomisMappingService from './nomisMappingService'

jest.mock('.')
jest.mock('./authService')
jest.mock('./locationService')
jest.mock('./involvedStaffService')
jest.mock('./offenderService')
jest.mock('./nomisMappingService')

const involvedStaffService = new InvolvedStaffService(null, null, null, null, null) as jest.Mocked<InvolvedStaffService>

const locationService = new LocationService(null, null) as jest.Mocked<LocationService>

const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>

const nomisMappingService = new NomisMappingService(null) as jest.Mocked<NomisMappingService>
const authService = new AuthService(null) as jest.Mocked<AuthService>

let reportDetailBuilder

const locationId = 123456
const incidentLocationId = 'location-uuid'
const dpsLocationId = 'location-uuid'

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue(`system-token-for-Bob`)
  locationService.getPrisonById = jest.fn()
  locationService.getPrisonById.mockResolvedValue({
    agencyId: 'MDI',
    description: 'HMP Moorland',
  } as Prison)

  reportDetailBuilder = new ReportDetailBuilder(
    involvedStaffService,
    locationService,
    offenderService,
    nomisMappingService,
    authService
  )
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Build details', () => {
  it('succeeds', async () => {
    locationService.getLocation.mockResolvedValue('Wing A')

    involvedStaffService.getInvolvedStaff.mockResolvedValue([
      { name: 'JANET SMITH', userId: 'J_SMITH', statementId: 22, email: 'janet@gmail.com' },
      { name: 'MAUREEN TYLER', userId: 'M_TYLER', statementId: 24, email: 'maureen@gmail.com' },
    ] as InvolvedStaff[])

    offenderService.getOffenderDetails.mockResolvedValue({ displayName: 'Jim Burgler', offenderNo: 'A1234AA' })

    const report: Report = {
      id: 1,
      username: 'J_SMITH',
      offenderNo: 'A1234AA',
      form: { incidentDetails: { locationId, incidentLocationId } } as UseOfForceReport,
      incidentDate: new Date('2015-03-26T12:00:00Z'),
      bookingId: 33,
      reporterName: 'A User',
      submittedDate: new Date('2015-03-25T12:00:00Z'),
      agencyId: 'MDI',
      status: 'SUBMITTED',
    }

    const result = await reportDetailBuilder.build('Bob', report)

    expect(result).toStrictEqual({
      bookingId: 33,
      evidence: {
        cctv: undefined,
        evidenceBaggedTagged: 'No',
        photographs: undefined,
      },
      incidentDetails: {
        incidentDate: new Date('2015-03-26T12:00:00.000Z'),
        incidentLocationId: 'location-uuid',
        location: 'Wing A',
        offenderName: 'Jim Burgler',
        offenderNumber: 'A1234AA',
        plannedUseOfForce: undefined,
        authorisedBy: undefined,
        prison: {
          agencyId: 'MDI',
          description: 'HMP Moorland',
        },
        staffInvolved: [
          {
            isReporter: true,
            name: 'Janet Smith',
            reportId: 1,
            statementId: 22,
            username: 'J_SMITH',
            email: 'janet@gmail.com',
          },
          {
            isReporter: false,
            name: 'Maureen Tyler',
            reportId: 1,
            statementId: 24,
            username: 'M_TYLER',
            email: 'maureen@gmail.com',
          },
        ],
        witnesses: 'None',
      },
      incidentId: 1,
      offenderDetail: {
        displayName: 'Jim Burgler',
        offenderNo: 'A1234AA',
      },
      relocationAndInjuries: {
        f213CompletedBy: undefined,
        healthcareStaffPresent: undefined,
        prisonerHospitalisation: undefined,
        prisonerInjuries: undefined,
        prisonerRelocation: undefined,
        relocationCompliancy: 'No',
        staffHospitalisation: undefined,
        staffMedicalAttention: undefined,
      },
      reporterName: 'A User',
      submittedDate: new Date('2015-03-25T12:00:00.000Z'),
      useOfForceDetails: {
        bodyCameras: undefined,
        batonDrawn: undefined,
        batonDrawnAgainstPrisoner: undefined,
        pavaDrawn: undefined,
        pavaDrawnAgainstPrisoner: undefined,
        taserDrawn: undefined,
        bittenByPrisonDog: undefined,
        controlAndRestraintUsed: undefined,
        guidingHoldUsed: undefined,
        escortingHoldUsed: undefined,
        handcuffsApplied: undefined,
        painInducingTechniques: undefined,
        weaponsObserved: undefined,
        personalProtectionTechniques: undefined,
        positiveCommunicationUsed: undefined,
        primaryReason: undefined,
        reasonsForUseOfForce: undefined,
      },
      reportStatus: 'SUBMITTED',
    })
  })

  it('gets location details from MappingService when incidentLocationId not known', async () => {
    locationService.getLocation.mockResolvedValue('Wing A')
    nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId.mockResolvedValue({
      dpsLocationId,
      nomisLocationId: 123456,
    })

    involvedStaffService.getInvolvedStaff.mockResolvedValue([] as InvolvedStaff[])

    offenderService.getOffenderDetails.mockResolvedValue({ displayName: 'Jim Burgler', offenderNo: 'A1234AA' })

    const report: Report = {
      id: 1,
      username: 'J_SMITH',
      offenderNo: 'A1234AA',
      form: { incidentDetails: { locationId } } as UseOfForceReport,
      incidentDate: new Date('2015-03-26T12:00:00Z'),
      bookingId: 33,
      reporterName: 'A User',
      submittedDate: new Date('2015-03-25T12:00:00Z'),
      agencyId: 'MDI',
    }

    await reportDetailBuilder.build('Bob', report)

    expect(nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId).toHaveBeenCalledWith(
      'system-token-for-Bob',
      locationId
    )
  })

  it('gets location description from location service correctly', async () => {
    locationService.getLocation.mockResolvedValue('Wing A')

    involvedStaffService.getInvolvedStaff.mockResolvedValue([] as InvolvedStaff[])

    offenderService.getOffenderDetails.mockResolvedValue({ displayName: 'Jim Burgler', offenderNo: 'A1234AA' })

    const report: Report = {
      id: 1,
      username: 'J_SMITH',
      offenderNo: 'A1234AA',
      form: { incidentDetails: { locationId, incidentLocationId } } as UseOfForceReport,
      incidentDate: new Date('2015-03-26T12:00:00Z'),
      bookingId: 33,
      reporterName: 'A User',
      submittedDate: new Date('2015-03-25T12:00:00Z'),
      agencyId: 'MDI',
    }

    await reportDetailBuilder.build('Bob', report)

    expect(locationService.getLocation).toHaveBeenCalledWith('system-token-for-Bob', incidentLocationId)
  })
})
