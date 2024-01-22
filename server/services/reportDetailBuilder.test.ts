import { Prison } from '../data/prisonClientTypes'
import { InvolvedStaff, Report } from '../data/incidentClientTypes'
import { LocationService, OffenderService, InvolvedStaffService } from '.'
import ReportDetailBuilder from './reportDetailBuilder'
import { UseOfForceReport } from '../data/UseOfForceReport'

jest.mock('.')

const involvedStaffService = new InvolvedStaffService(null, null, null, null, null) as jest.Mocked<InvolvedStaffService>

const locationService = new LocationService(null) as jest.Mocked<LocationService>

const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>

let reportDetailBuilder

beforeEach(() => {
  const systemToken = async username => `system-token-for-${username}`
  locationService.getPrisonById.mockResolvedValue({
    agencyId: 'MDI',
    description: 'HMP Moorland',
  } as Prison)
  reportDetailBuilder = new ReportDetailBuilder(involvedStaffService, locationService, offenderService, systemToken)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Build details', () => {
  it('succeeds', async () => {
    locationService.getLocation.mockResolvedValue('Wing A')

    involvedStaffService.getInvolvedStaff.mockResolvedValue([
      { name: 'JANET SMITH', userId: 'J_SMITH', statementId: 22 },
      { name: 'MAUREEN TYLER', userId: 'M_TYLER', statementId: 24 },
    ] as InvolvedStaff[])

    offenderService.getOffenderDetails.mockResolvedValue({ displayName: 'Jim Burgler', offenderNo: 'A1234AA' })

    const report: Report = {
      id: 1,
      username: 'J_SMITH',
      offenderNo: 'A1234AA',
      form: { incidentDetails: { locationId: 2 } } as UseOfForceReport,
      incidentDate: new Date('2015-03-26T12:00:00Z'),
      bookingId: 33,
      reporterName: 'A User',
      submittedDate: new Date('2015-03-25T12:00:00Z'),
      agencyId: 'MDI',
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
          },
          {
            isReporter: false,
            name: 'Maureen Tyler',
            reportId: 1,
            statementId: 24,
            username: 'M_TYLER',
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
        controlAndRestraintUsed: undefined,
        guidingHoldUsed: undefined,
        escortingHoldUsed: undefined,
        handcuffsApplied: undefined,
        painInducingTechniques: undefined,
        pavaDrawn: undefined,
        personalProtectionTechniques: undefined,
        positiveCommunicationUsed: undefined,
        primaryReason: undefined,
        reasonsForUseOfForce: undefined,
      },
    })
  })
})
