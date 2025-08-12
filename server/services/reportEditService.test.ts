import ReportEditService from './reportEditService'
import LocationService from './locationService'
import AuthService from './authService'

jest.mock('./authService')
jest.mock('./locationService')
const locationService = new LocationService(null, null) as jest.Mocked<LocationService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
locationService.getLocation = jest.fn()
locationService.getPrisonById = jest.fn()

let reportEditService

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue(`system-token-1`)
  reportEditService = new ReportEditService(locationService, authService)
})

describe('constructChangesToView', () => {
  it('constructs response correctly when planned use of force, incident date and witneeses have changed', async () => {
    const reportSection = {
      text: 'the incident details',
      section: 'incidentDetails',
    }
    const changes = {
      plannedUseOfForce: {
        oldValue: true,
        newValue: 'false',
        hasChanged: true,
      },
      incidentDate: {
        oldValue: '2020-03-02T13:00:00.000Z',
        newValue: '2020-03-05T14:17:00.000Z',
        hasChanged: true,
      },
      witnesses: {
        oldValue: [],
        newValue: [
          {
            name: 'someone else',
          },
          {
            name: 'tom',
          },
        ],
        hasChanged: true,
      },
    }

    const result = await reportEditService.constructChangesToView('user-1', reportSection, changes)

    expect(result).toEqual([
      {
        question: 'Was use of force planned',
        oldValue: true,
        newValue: 'false',
      },
      {
        question: 'Incident date',
        oldValue: '02/03/2020 13:00',
        newValue: '05/03/2020 14:17',
      },
      {
        question: 'Witnesses to the incident',
        oldValue: '',
        newValue: 'someone else, tom',
      },
    ])
  })

  it('handles scenario where witnesses changed from some to none', async () => {
    const reportSection = {
      text: 'the incident details',
      section: 'incidentDetails',
    }
    const changes = {
      witnesses: {
        oldValue: [
          {
            name: 'tom',
          },
          {
            name: 'another person',
          },
        ],
        newValue: [],
        hasChanged: true,
      },
    }

    const result = await reportEditService.constructChangesToView('user-1', reportSection, changes)

    expect(result).toEqual([
      {
        question: 'Witnesses to the incident',
        oldValue: 'tom, another person',
        newValue: '',
      },
    ])
  })

  it('calls upstream services with correct args', async () => {
    const reportSection = {
      text: 'the incident details',
      section: 'incidentDetails',
    }
    const changes = {
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
    }

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

    locationService.getLocation.mockResolvedValueOnce('A Wing Exercise')
    locationService.getLocation.mockResolvedValueOnce('Gym')

    await reportEditService.constructChangesToView('user-1', reportSection, changes)

    expect(locationService.getPrisonById).toHaveBeenCalledWith('system-token-1', 'WRI')
    expect(locationService.getPrisonById).toHaveBeenCalledWith('system-token-1', 'AYI')

    expect(locationService.getLocation).toHaveBeenCalledWith('system-token-1', 'UUID-111')
    expect(locationService.getLocation).toHaveBeenCalledWith('system-token-1', 'UUID-222')
  })
})

describe('validateReasonForChangeInput', () => {
  it('Should return error when no reason provided', () => {
    const input = { reportSection: { text: 'incident details' } }

    const result = reportEditService.validateReasonForChangeInput(input)
    expect(result).toEqual([
      {
        href: '#reason',
        text: `Select the reason for changing ${input.reportSection.text}`,
      },
    ])
  })

  it("Should return correct error when 'anotherReasonForEdit' provided but no accompanying explanation text", () => {
    const input = { reason: 'anotherReasonForEdit' }

    const result = reportEditService.validateReasonForChangeInput(input)
    expect(result).toEqual([{ href: '#reasonText', text: 'Please specify the reason' }])
  })

  it('should return no validation errors', () => {
    const input = {
      reason: 'errorInReport',
      reasonText: '',
      reportSection: {
        text: 'the incident details',
        section: 'incidentDetails',
      },
    }
    const result = reportEditService.validateReasonForChangeInput(input)
    expect(result).toEqual([])
  })
})
