import ReportDetailBuilder from './reportDetailBuilder'

const locationService = {
  getPrisonById: jest.fn().mockResolvedValue({ agencyId: 'MDI', description: 'HMP Moorland' }),
  getLocation: jest.fn(),
}

const involvedStaffService = {
  getInvolvedStaff: jest.fn(),
}

const offenderService = {
  getOffenderDetails: jest.fn(),
}

let reportDetailBuilder

beforeEach(() => {
  const systemToken = async username => `system-token-for-${username}`
  reportDetailBuilder = new ReportDetailBuilder({ involvedStaffService, locationService, systemToken, offenderService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Build details', () => {
  it('succeeds', async () => {
    locationService.getLocation.mockResolvedValue({ description: 'Wing A' })

    involvedStaffService.getInvolvedStaff.mockResolvedValue([
      { name: 'JANET SMITH', userId: 'J_SMITH', statementId: 22 },
    ])

    offenderService.getOffenderDetails.mockResolvedValue({ displayName: 'Jim Burgler', offenderNo: 'A1234AA' })

    const report = {
      id: 1,
      form: { incidentDetails: { locationId: 2 } },
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
        bodyCameras: undefined,
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
        prison: {
          agencyId: 'MDI',
          description: 'HMP Moorland',
        },
        staffInvolved: [
          {
            name: 'Janet Smith',
            reportId: 1,
            statementId: 22,
            username: 'J_SMITH',
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
        batonDrawn: undefined,
        controlAndRestraintUsed: undefined,
        guidingHoldUsed: undefined,
        handcuffsApplied: undefined,
        painInducingTechniques: undefined,
        pavaDrawn: undefined,
        personalProtectionTechniques: undefined,
        positiveCommunicationUsed: undefined,
      },
    })
  })
})
