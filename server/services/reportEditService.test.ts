import moment from 'moment'
import ReportEditService from './reportEditService'
import LocationService from './locationService'
import AuthService from './authService'
import ReportService from './reportService'
import EditIncidentDetailsService from './editIncidentDetailsService'
import questionSets from '../config/edit/questionSets'
import EditRelocationAndInjuriesService from './editRelocationAndInjuriesService'

jest.mock('./authService')
jest.mock('./locationService')
const locationService = new LocationService(null, null) as jest.Mocked<LocationService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>
const editIncidentDetailsService = new EditIncidentDetailsService(null, null) as jest.Mocked<EditIncidentDetailsService>
const editRelocationAndInjuriesService =
  new EditRelocationAndInjuriesService() as jest.Mocked<EditRelocationAndInjuriesService>

locationService.getLocation = jest.fn()
locationService.getPrisonById = jest.fn()

let reportEditService

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue(`system-token-1`)
  reportEditService = new ReportEditService(
    reportService,
    editIncidentDetailsService,
    editRelocationAndInjuriesService,
    locationService,
    authService
  )
})

describe('constructChangesToView', () => {
  editIncidentDetailsService.buildIncidentDetails = jest.fn()
  it('call upstream services with correct args', async () => {
    const reportSection = {
      text: 'the incident details',
      section: 'incidentDetails',
    }
    const changes = {}

    await reportEditService.constructChangesToView('user-1', reportSection, changes)

    expect(editIncidentDetailsService.buildIncidentDetails).toHaveBeenCalledWith(
      'user-1',
      questionSets.incidentDetails,
      changes
    )
  })
})

describe('compareEditsWithReport', () => {
  it('returns the correct result', () => {
    const reportSection = 'incidentDetails'
    const report = {
      id: 1,
      incidentDate: new Date('2020-03-02T14:17:00Z'),
      agencyId: 'WRI',
      form: {
        incidentDetails: {
          locationId: 12345,
          plannedUseOfForce: false,
          incidentLocationId: '12345-ABC',
        },
      },
    }
    const valuesToCompareWithReport = {
      incidentDate: new Date('2020-03-02T14:17:00Z'),
      newAgencyId: 'MDI',
      incidentLocationId: '56789-ABC',
      plannedUseOfForce: 'true',
      authorisedBy: 'Joe bloggs',
      witnesses: [
        {
          name: 'Tom Smith',
        },
      ],
    }

    const actualResult = reportEditService.compareEditsWithReport({
      report,
      valuesToCompareWithReport,
      reportSection,
    })

    const expectedResult = {
      agencyId: {
        hasChanged: true,
        newValue: 'MDI',
        oldValue: 'WRI',
        question: 'Prison',
      },
      authorisedBy: {
        hasChanged: true,
        newValue: 'Joe bloggs',
        oldValue: undefined,
        question: 'Who authorised use of force',
      },
      incidentDate: {
        hasChanged: false,
        newValue: new Date('2020-03-02T14:17:00Z'),
        oldValue: new Date('2020-03-02T14:17:00Z'),
        question: 'Incident date',
      },
      incidentLocation: {
        hasChanged: true,
        newValue: '56789-ABC',
        oldValue: '12345-ABC',
        question: 'Incident location',
      },
      plannedUseOfForce: {
        hasChanged: true,
        newValue: 'true',
        oldValue: false,
        question: 'Was use of force planned',
      },
      witnesses: {
        hasChanged: true,
        newValue: [
          {
            name: 'Tom Smith',
          },
        ],
        oldValue: undefined,
        question: 'Witnesses to the incident',
      },
    }
    expect(actualResult).toEqual(expectedResult)
  })
})

describe('removeHasChangedKey', () => {
  it('should remove the hasChanged key', () => {
    const input = {
      agencyId: { newValue: 'BCI', oldValue: 'WRI', hasChanged: true },
      witnesses: { newValue: [{ name: 'jimmy' }], hasChanged: true },
      incidentDate: { newValue: '2020-03-10', oldValue: '2020-03-23', hasChanged: true },
    }

    const output = {
      agencyId: { newValue: 'BCI', oldValue: 'WRI' },
      witnesses: { newValue: [{ name: 'jimmy' }] },
      incidentDate: { newValue: '2020-03-10', oldValue: '2020-03-23' },
    }

    expect(reportEditService.removeHasChangedKey(input)).toEqual(output)
  })
})
describe('validateReasonForChangeInput', () => {
  it('Should return error when no reason or additional info provided', () => {
    const input = { reportSection: { section: 'incidentDetails', text: 'the incident details' } }

    const result = reportEditService.validateReasonForChangeInput(input)
    expect(result).toEqual([
      {
        href: '#reason',
        text: `Provide a reason for changing the incident details`,
      },
      {
        href: '#reasonAdditionalInfo',
        text: 'Provide additional information to explain the changes you are making',
      },
    ])
  })

  it("Should return correct error when 'another reason' selected but no accompanying text or reasonAdditionalInfo text ", () => {
    const input = {
      reason: 'anotherReasonForEdit',
      reportSection: { section: 'incidentDetails', text: 'the incident details' },
    }

    const result = reportEditService.validateReasonForChangeInput(input)
    expect(result).toEqual([
      { href: '#reasonText', text: 'Specify the reason for changing the incident details' },
      {
        href: '#reasonAdditionalInfo',
        text: 'Provide additional information to explain the changes you are making',
      },
    ])
  })

  it("Should return correct error when 'other reason' selected and corresponding text provided but 'additional info' text missing", () => {
    const input = {
      reason: 'anotherReasonForEdit',
      reasonText: 'some reason text',
      reportSection: { section: 'incidentDetails', text: 'the incident details' },
    }

    const result = reportEditService.validateReasonForChangeInput(input)
    expect(result).toEqual([
      {
        href: '#reasonAdditionalInfo',
        text: 'Provide additional information to explain the changes you are making',
      },
    ])
  })

  it('should return no validation errors', () => {
    const input = {
      reason: 'errorInReport',
      reasonText: '',
      reasonAdditionalInfo: 'additional info text',
      reportSection: {
        text: 'the incident details',
        section: 'incidentDetails',
      },
    }
    const result = reportEditService.validateReasonForChangeInput(input)
    expect(result).toEqual([])
  })
})

describe('reorderKeysInChangesArrayWithinEditsToSpecificSequence', () => {
  it('should order the response object key-value pairs correctly', () => {
    const incidentDate = moment('2025-07-28 10:37:00')
    const now = moment()
    const reportEditData = [
      {
        id: 1,
        edit_date: now,
        editor_user_id: 'USER-1',
        editor_name: 'Joe Bloggs',
        report_id: 1,
        reason: 'errorInReport',
        additional_comments: '',
        report_owner_changed: false,
        changes: [
          {
            witnesses: {
              newValue: [{ name: 'jimmy' }, { name: 'another person' }, { name: 'tom' }],
              oldValue: [{ name: 'jimmy' }, { name: 'another person' }],
              question: 'Witnesses to the incident',
            },
            authorisedBy: { newValue: 'Joe Bloggs', question: 'Who authorised use of force' },
            incidentDate: {
              newValue: incidentDate,
              oldValue: incidentDate,
              question: 'Incident date',
            },
            incidentLocation: {
              newValue: 'UUID-1',
              oldValue: 'UUID-2',
              question: 'Incident location',
            },
            plannedUseOfForce: { newValue: true, oldValue: false, question: 'Was use of force planned' },
          },
        ],
        reason_text: '',
      },
    ]

    const expectedOrderOfKeysInChangesObj = [
      'incidentDate',
      'incidentLocation',
      'plannedUseOfForce',
      'authorisedBy',
      'witnesses',
    ]

    const response = reportEditService.reorderKeysInChangesArrayWithinEditsToSpecificSequence(reportEditData)
    const actualOderOfKeysinChangesObj = Object.keys(response[0].changes[0])
    expect(actualOderOfKeysinChangesObj).toEqual(expectedOrderOfKeysInChangesObj)
  })
})

describe('applyCorrectFormat', () => {
  it('should return the correct format of incident date', async () => {
    const key = 'incidentDate'
    const val = moment('2025-07-27 14:30', 'YYYY-MM-DD HH:mm')
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('27/07/2025 14:30')
  })

  it('should return prison name', async () => {
    locationService.getPrisonById.mockResolvedValue({
      agencyId: 'LEI',
      description: 'HMP Leicester',
      active: true,
      agencyType: 'HMP',
    })

    const key = 'agencyId'
    const val = 'LEI'
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('HMP Leicester')
  })

  it('should return location name', async () => {
    locationService.getLocation.mockResolvedValue('Cell-1')

    const key = 'incidentLocation'
    const val = 'UUID-1'
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('Cell-1')
  })

  it('should return authorisedby without modification', async () => {
    const key = 'authorisedBy'
    const val = 'Harry'
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('Harry')
  })

  it('should convert boolean to Yes', async () => {
    const key = 'plannedUseOfForce'
    const val = true
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('Yes')
  })

  it('should return witnesses array as a single string', async () => {
    const key = 'witnesses'
    const val = [
      {
        name: 'jimmy',
      },
      {
        name: 'tom',
      },
    ]
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('jimmy, tom')
  })

  it('should return staffNeedingMedicalAttention array as a single string', async () => {
    const key = 'staffNeedingMedicalAttention'
    const val = [
      {
        name: 'jimmy',
        hospitalisation: true,
      },
      {
        name: 'tom',
        hospitalisation: false,
      },
    ]
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('jimmy (hospitalised), tom')
  })
})
