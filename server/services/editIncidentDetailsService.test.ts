import moment from 'moment'

import LocationService from './locationService'
import AuthService from './authService'
import EditIncidentDetailsService from './editIncidentDetailsService'
import questionSets from '../config/edit/questionSets'

jest.mock('./authService')
jest.mock('./locationService')
const locationService = new LocationService(null, null) as jest.Mocked<LocationService>
const authService = new AuthService(null) as jest.Mocked<AuthService>

locationService.getLocation = jest.fn()
locationService.getPrisonById = jest.fn()

let editIncidentDetailsService

const changes = {
  incidentDate: {
    oldValue: moment('2025-07-26 15:30', 'YYYY-MM-DD HH:mm'),
    newValue: moment('2025-07-27 14:30', 'YYYY-MM-DD HH:mm'),
    hasChanged: true,
  },
  incidentLocation: {
    oldValue: 'UUID-111',
    newValue: 'UUID-222',
    hasChanged: true,
  },
  agencyId: {
    oldValue: 'WRI',
    newValue: 'AYI',
    hasChanged: true,
  },
  plannedUseOfForce: {
    oldValue: true,
    newValue: false,
    hasChanged: true,
  },
  authorisedBy: {
    oldValue: 'John',
    newValue: undefined,
    hasChanged: true,
  },
  witnesses: {
    newValue: [
      {
        name: 'John Smith',
      },
    ],
    oldValue: [
      {
        name: 'John Smith',
      },
      {
        name: 'Tom',
      },
    ],
    question: 'Witnesses to the incident',
    hasChanged: true,
  },
}

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue(`system-token-1`)
  editIncidentDetailsService = new EditIncidentDetailsService(locationService, authService)

  locationService.getPrisonById.mockResolvedValueOnce({
    agencyId: 'WRI',
    description: 'Whitemoor (HMP)',
    agencyType: 'INST',
    active: true,
  })

  locationService.getPrisonById.mockResolvedValueOnce({
    agencyId: 'AYI',
    description: 'Aylesbury (HMP)',
    agencyType: 'INST',
    active: true,
  })
})

describe('buildIncidentDetails', () => {
  it('calls upstream services with correct args', async () => {
    locationService.getLocation.mockResolvedValueOnce('Cell one')
    locationService.getLocation.mockResolvedValueOnce('Cell two')
    const questionSet = questionSets.incidentDetails
    await editIncidentDetailsService.buildIncidentDetails('user-1', questionSet, changes)

    expect(locationService.getPrisonById).toHaveBeenCalledWith('system-token-1', 'WRI')
    expect(locationService.getPrisonById).toHaveBeenCalledWith('system-token-1', 'AYI')
    expect(locationService.getLocation).toHaveBeenCalledWith('system-token-1', 'UUID-111')
    expect(locationService.getLocation).toHaveBeenCalledWith('system-token-1', 'UUID-222')
  })

  it('returns the correct response', async () => {
    locationService.getLocation.mockResolvedValueOnce('Cell one')
    locationService.getLocation.mockResolvedValueOnce('Cell two')
    const questionSet = questionSets.incidentDetails

    const result = await editIncidentDetailsService.buildIncidentDetails('user-1', questionSet, changes)
    const expectedResult = [
      { newValue: '27/07/2025 14:30', oldValue: '26/07/2025 15:30', question: 'Incident date' },
      { newValue: 'Cell two', oldValue: 'Cell one', question: 'Incident location' },
      { newValue: 'Aylesbury (HMP)', oldValue: 'Whitemoor (HMP)', question: 'Prison' },
      { newValue: false, oldValue: true, question: 'Was use of force planned' },
      { newValue: undefined, oldValue: 'John', question: 'Who authorised use of force' },
      { newValue: 'John Smith', oldValue: 'John Smith, Tom', question: 'Witnesses to the incident' },
    ]
    expect(result).toEqual(expectedResult)
  })

  it('handles scenario when no witnesses in current report', async () => {
    changes.witnesses = {
      newValue: [
        {
          name: 'John Smith',
        },
      ],
      oldValue: undefined,
      question: 'Witnesses to the incident',
      hasChanged: true,
    }

    const questionSet = questionSets.incidentDetails
    locationService.getLocation.mockResolvedValueOnce('Cell one')
    locationService.getLocation.mockResolvedValueOnce('Cell two')

    const result = await editIncidentDetailsService.buildIncidentDetails('user-1', questionSet, changes)
    const expectedResult = [
      { newValue: '27/07/2025 14:30', oldValue: '26/07/2025 15:30', question: 'Incident date' },
      { newValue: 'Cell two', oldValue: 'Cell one', question: 'Incident location' },
      { newValue: 'Aylesbury (HMP)', oldValue: 'Whitemoor (HMP)', question: 'Prison' },
      { newValue: false, oldValue: true, question: 'Was use of force planned' },
      { newValue: undefined, oldValue: 'John', question: 'Who authorised use of force' },
      { newValue: 'John Smith', oldValue: undefined, question: 'Witnesses to the incident' },
    ]
    expect(result).toEqual(expectedResult)
  })
  it('handles scenario when witnesses no longer present', async () => {
    changes.witnesses = {
      newValue: undefined,
      oldValue: [
        {
          name: 'John Smith',
        },
      ],
      question: 'Witnesses to the incident',
      hasChanged: true,
    }
    const questionSet = questionSets.incidentDetails
    locationService.getLocation.mockResolvedValueOnce('Cell one')
    locationService.getLocation.mockResolvedValueOnce('Cell two')

    const result = await editIncidentDetailsService.buildIncidentDetails('user-1', questionSet, changes)
    const expectedResult = [
      { newValue: '27/07/2025 14:30', oldValue: '26/07/2025 15:30', question: 'Incident date' },
      { newValue: 'Cell two', oldValue: 'Cell one', question: 'Incident location' },
      { newValue: 'Aylesbury (HMP)', oldValue: 'Whitemoor (HMP)', question: 'Prison' },
      { newValue: false, oldValue: true, question: 'Was use of force planned' },
      { newValue: undefined, oldValue: 'John', question: 'Who authorised use of force' },
      { newValue: undefined, oldValue: 'John Smith', question: 'Witnesses to the incident' },
    ]
    expect(result).toEqual(expectedResult)
  })
})
