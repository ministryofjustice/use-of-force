import moment from 'moment'
import IncidentClient from '../data/incidentClient'
import { Report } from '../data/incidentClientTypes'
import ReportEditService from './reportEditService'
import LocationService from './locationService'
import AuthService from './authService'
import ReportService from './reportService'
import EditIncidentDetailsService from './editIncidentDetailsService'
import questionSets from '../config/edit/questionSets'
import EditRelocationAndInjuriesService from './editRelocationAndInjuriesService'
import EditEvidenceService from './editEvidenceService'
import EditUseOfForceDetailsService from './editUseOfForceDetailsService'
import logger from '../../log'

jest.mock('./authService')
jest.mock('./locationService')
const locationService = new LocationService(null, null) as jest.Mocked<LocationService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>
const editIncidentDetailsService = new EditIncidentDetailsService(null, null) as jest.Mocked<EditIncidentDetailsService>
const editRelocationAndInjuriesService =
  new EditRelocationAndInjuriesService() as jest.Mocked<EditRelocationAndInjuriesService>
const editEvidenceService = new EditEvidenceService() as jest.Mocked<EditEvidenceService>
const editUseOfForceDetailsService = new EditUseOfForceDetailsService() as jest.Mocked<EditUseOfForceDetailsService>
const incidentClient = new IncidentClient(null, null, null) as jest.Mocked<IncidentClient>

locationService.getLocation = jest.fn()
locationService.getPrisonById = jest.fn()
reportService.updateWithEdits = jest.fn()
reportService.updateTwoReportSections = jest.fn()
reportService.deleteIncidentAndUpdateReportEdit = jest.fn()
logger.error = jest.fn()
incidentClient.getReportForReviewer = jest.fn()

let reportEditService

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue(`system-token-1`)
  reportEditService = new ReportEditService(
    reportService,
    editIncidentDetailsService,
    editRelocationAndInjuriesService,
    editEvidenceService,
    editUseOfForceDetailsService,
    locationService,
    authService,
    incidentClient
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
        question: 'Who authorised use of force?',
      },
      incidentDate: {
        hasChanged: false,
        newValue: new Date('2020-03-02T14:17:00Z'),
        oldValue: new Date('2020-03-02T14:17:00Z'),
        question: 'When did the incident happen?',
      },
      incidentLocation: {
        hasChanged: true,
        newValue: '56789-ABC',
        oldValue: '12345-ABC',
        question: 'Where did the incident happen?',
      },
      plannedUseOfForce: {
        hasChanged: true,
        newValue: 'true',
        oldValue: false,
        question: 'Was use of force planned?',
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
    expect(result).toEqual({
      errors: [
        { href: '#reason', text: 'Provide a reason for changing the incident details' },
        { href: '#reasonAdditionalInfo', text: 'Provide additional information to explain the changes you are making' },
      ],
      sanitizedInputValues: { reasonAdditionalInfo: undefined, reasonText: undefined },
    })
  })

  it("Should return correct error when 'another reason' selected but no accompanying text or reasonAdditionalInfo text ", () => {
    const input = {
      reason: 'anotherReasonForEdit',
      reportSection: { section: 'incidentDetails', text: 'the incident details' },
    }

    const result = reportEditService.validateReasonForChangeInput(input)
    expect(result).toEqual({
      errors: [
        { href: '#reasonText', text: 'Specify the reason for changing the incident details' },
        { href: '#reasonAdditionalInfo', text: 'Provide additional information to explain the changes you are making' },
      ],
      sanitizedInputValues: { reasonAdditionalInfo: undefined, reasonText: undefined },
    })
  })

  it("Should return correct error when 'other reason' selected and corresponding text provided but 'additional info' text missing", () => {
    const input = {
      reason: 'anotherReasonForEdit',
      reasonText: 'some reason text',
      reportSection: { section: 'incidentDetails', text: 'the incident details' },
    }

    const result = reportEditService.validateReasonForChangeInput(input)
    expect(result).toEqual({
      errors: [
        { href: '#reasonAdditionalInfo', text: 'Provide additional information to explain the changes you are making' },
      ],
      sanitizedInputValues: {
        reasonAdditionalInfo: undefined,
        reasonText: 'some reason text',
      },
    })
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
    expect(result).toEqual({
      errors: [],
      sanitizedInputValues: { reasonAdditionalInfo: 'additional info text', reasonText: '' },
    })
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

  it('should return empty string if reasons undefined (eg old report where the reasons question was never asked)', async () => {
    const key = 'reasons'
    const val = undefined
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('')
  })

  it('should return a string of one reason)', async () => {
    const key = 'reasons'
    const val = ['ASSAULT_ON_ANOTHER_PRISONER']
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('Assault on another prisoner')
  })

  it('should return a string of multiple reasons)', async () => {
    const key = 'reasons'
    const val = ['ASSAULT_ON_ANOTHER_PRISONER', 'ASSAULT_ON_A_MEMBER_OF_STAFF']
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('Assault on another prisoner, Assault on a member of staff')
  })

  it('should return primaryReason label', async () => {
    const key = 'primaryReason'
    const val = 'ASSAULT_ON_ANOTHER_PRISONER'
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('Assault on another prisoner')
  })

  it('should return empty string if primaryReason is undefined (eg old report where the primaryReason question was never asked)', async () => {
    const key = 'primaryReason'
    const val = undefined
    const result = await reportEditService.applyCorrectFormat(key, val, 'user-1')
    expect(result).toEqual('')
  })
})

describe('getWhatChanged', () => {
  it('returns the question text for a set of changes', async () => {
    const changes = [
      {
        prisonerRelocation: {
          newValue: 'GATED_CELL',
          oldValue: 'OWN_CELL',
          question: 'Where was the prisoner relocated to?',
        },
        relocationCompliancy: {
          newValue: false,
          oldValue: true,
          question: 'Was the prisoner compliant?',
        },
        relocationType: {
          newValue: 'PRIMARY',
          question: 'What was the type of relocation?',
        },
      },
    ]

    const result = await reportEditService.getWhatChanged(changes)
    expect(result).toEqual([
      'Where was the prisoner relocated to?',
      'Was the prisoner compliant?',
      'What was the type of relocation?',
    ])
  })
})

describe('getChangedFrom', () => {
  it('should return the previous values for each question', async () => {
    const changes = [
      {
        prisonerRelocation: {
          oldValue: 'GATED_CELL',
          newValue: 'OWN_CELL',
          question: 'Where was the prisoner relocated to?',
        },
        relocationCompliancy: {
          oldValue: false,
          newValue: true,
          question: 'Was the prisoner compliant?',
        },
        relocationType: {
          oldValue: 'PRIMARY',
          question: 'What was the type of relocation?',
        },
      },
    ]

    const result = await reportEditService.getChangedFrom(changes)
    expect(result).toEqual(['Gated cell', 'No', 'Primary relocation'])
  })
})

describe('getChangedTo', () => {
  it('should return the new values for each question', async () => {
    const changes = [
      {
        prisonerRelocation: {
          oldValue: 'GATED_CELL',
          newValue: 'OWN_CELL',
          question: 'Where was the prisoner relocated to?',
        },
        relocationCompliancy: {
          oldValue: false,
          newValue: true,
          question: 'Was the prisoner compliant?',
        },
        relocationType: {
          oldValue: 'PRIMARY',
          question: 'What was the type of relocation?',
        },
      },
    ]

    const result = await reportEditService.getChangedTo(changes)
    expect(result).toEqual(['Own cell', 'Yes', undefined])
  })
})

describe('mapReasonToTitleAndText', () => {
  const reasons = [
    [{ reason: 'errorInReport' }, 'Error in report'],
    [{ reason: 'somethingMissingFromReport' }, 'Something missing'],
    [{ reason: 'newEvidence' }, 'New evidence'],
    [{ reason: 'anotherReasonForEdit', reasonText: 'X' }, 'Another reason: X'],
  ]

  it.each(reasons)('maps %s', (data, expected) => {
    expect(reportEditService.mapReasonToTitleAndText(data)).toEqual(expected)
  })
})

describe('persistChanges', () => {
  const data = {
    reportId: 2,
    pageInput: {
      baggedEvidence: false,
      photographsTaken: false,
      cctvRecording: 'YES',
    },

    reportSection: {
      text: 'evidence',
      section: 'evidence',
    },
    changes: {
      baggedEvidence: {
        question: 'Was any evidence bagged and tagged?',
        oldValue: false,
        newValue: false,
      },
      photographsTaken: {
        question: 'Were any photographs taken?',
        oldValue: true,
        newValue: false,
      },
      cctvRecording: {
        question: 'Was any part of the incident captured on CCTV?',
        oldValue: 'NO',
        newValue: 'YES',
      },
    },

    reason: 'errorInReport',
    reasonText: '',
    reasonAdditionalInfo: 'Some additional text',
    reportOwnerChanged: false,
  }
  it('should call reportService.updateWithEdits with correct args for evidence section', async () => {
    await reportEditService.persistChanges('user1', data)

    expect(reportService.updateWithEdits).toHaveBeenCalledWith(
      'user1',
      2,
      'evidence',
      {
        baggedEvidence: false,
        photographsTaken: false,
        cctvRecording: 'YES',
      },
      data.changes,
      'errorInReport',
      '',
      'Some additional text',
      false,
      null
    )
  })

  it('logs error', async () => {
    reportService.updateWithEdits.mockRejectedValue(new Error('500'))
    await expect(reportEditService.persistChanges('user1', data)).rejects.toThrow()
    expect(logger.error).toHaveBeenCalledWith('Could not persist changes to report 2. Error: 500')
  })
})

describe('persistChangesForReasonsAndDetails', () => {
  const data = {
    reportId: 2,
    reportSection: {
      text: 'use of force details',
      section: 'useOfForceDetails',
    },
    reason: 'anotherReasonForEdit',
    reasonText: 'The reason',
    reasonAdditionalInfo: 'More text',
    reasonsForUofData: {
      reportSection: 'reasonsForUseOfForce',
      changes: {
        reasons: {
          question: 'Why was use of force applied against this prisoner?',
          oldValue: ['ASSAULT_ON_ANOTHER_PRISONER', 'FIGHT_BETWEEN_PRISONERS'],
          newValue: ['ASSAULT_ON_ANOTHER_PRISONER'],
        },
        primaryReason: {
          question: 'What was the primary reason use of force was applied against this prisoner?',
          oldValue: 'FIGHT_BETWEEN_PRISONERS',
        },
      },
      pageInputForReasons: ['ASSAULT_ON_ANOTHER_PRISONER'],
      pageInputForPrimaryReason: undefined,
    },
    uofDetailsData: {
      reportSection: 'useOfForceDetails',
      changes: {
        positiveCommunication: {
          question: 'Was positive communication used to de-escalate the situation with this prisoner?',
          oldValue: false,
          newValue: true,
        },
      },

      payload: {
        positiveCommunication: true,
        bodyWornCamera: 'NO',
        personalProtectionTechniques: false,
        batonDrawnAgainstPrisoner: false,
        pavaDrawnAgainstPrisoner: false,
        taserDrawn: false,
        bittenByPrisonDog: false,
        weaponsObserved: 'NO',
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        escortingHold: false,
        restraintPositions: 'NONE',
        painInducingTechniquesUsed: 'NONE',
        handcuffsApplied: true,
      },
    },
  }
  it('should call reportService.updateTwoReportSections with correct args', async () => {
    await reportEditService.persistChangesForReasonsAndDetails('user1', data)

    expect(reportService.updateTwoReportSections).toHaveBeenCalledWith('user1', {
      formSections: {
        reasonsForUseOfForce: {
          changes: {
            primaryReason: {
              oldValue: 'FIGHT_BETWEEN_PRISONERS',
              question: 'What was the primary reason use of force was applied against this prisoner?',
            },
            reasons: {
              newValue: ['ASSAULT_ON_ANOTHER_PRISONER'],
              oldValue: ['ASSAULT_ON_ANOTHER_PRISONER', 'FIGHT_BETWEEN_PRISONERS'],
              question: 'Why was use of force applied against this prisoner?',
            },
          },
          payload: { primaryReason: undefined, reasons: ['ASSAULT_ON_ANOTHER_PRISONER'] },
        },
        useOfForceDetails: {
          changes: {
            positiveCommunication: {
              newValue: true,
              oldValue: false,
              question: 'Was positive communication used to de-escalate the situation with this prisoner?',
            },
          },
          payload: {
            arcWarningUsed: undefined,
            batonDrawnAgainstPrisoner: false,
            batonUsed: undefined,
            bittenByPrisonDog: false,
            bodyWornCamera: 'NO',
            bodyWornCameraNumbers: undefined,
            escortingHold: false,
            guidingHold: true,
            guidingHoldOfficersInvolved: 2,
            handcuffsApplied: true,
            painInducingTechniquesUsed: 'NONE',
            pavaDrawnAgainstPrisoner: false,
            pavaUsed: undefined,
            personalProtectionTechniques: false,
            positiveCommunication: true,
            redDotWarning: undefined,
            restraintPositions: 'NONE',
            taserCycleExtended: undefined,
            taserDeployed: undefined,
            taserDrawn: false,
            taserOperativePresent: undefined,
            taserReenergised: undefined,
            weaponTypes: undefined,
            weaponsObserved: 'NO',
          },
        },
      },
      keys: ['reasonsForUseOfForce', 'useOfForceDetails'],
      reason: 'anotherReasonForEdit',
      reasonAdditionalInfo: 'More text',
      reasonText: 'The reason',
      reportId: 2,
    })
  })

  it('logs error', async () => {
    reportService.updateTwoReportSections.mockRejectedValue(new Error('500'))
    await expect(reportEditService.persistChangesForReasonsAndDetails('user1', data)).rejects.toThrow()
    expect(logger.error).toHaveBeenCalledWith('Could not persist changes to report 2. Error: 500')
  })
})

describe('validateReasonForDeleteInput', () => {
  it('should return error if reasonForDelete is missing', () => {
    const input = { reasonForDelete: '' }
    const result = reportEditService.validateReasonForDeleteInput(input)
    expect(result).toEqual([
      {
        href: '#reasonForDelete',
        text: 'Provide a reason for deleting this report',
      },
    ])
  })

  it('should return error if reasonForDelete is anotherReason and reasonForDeleteText is missing', () => {
    const input = { reasonForDelete: 'anotherReason', reasonForDeleteText: '' }
    const result = reportEditService.validateReasonForDeleteInput(input)
    expect(result).toEqual([
      {
        href: '#reasonForDeleteText',
        text: 'Specify a reason for deleting this report',
      },
    ])
  })

  it('should return no errors if valid reasonForDelete is provided', () => {
    const input = { reasonForDelete: 'errorInReport', reasonForDeleteText: '' }
    const result = reportEditService.validateReasonForDeleteInput(input)
    expect(result).toEqual([])
  })

  it('should return no errors if anotherReason and reasonForDeleteText are provided', () => {
    const input = { reasonForDelete: 'anotherReason', reasonForDeleteText: 'details' }
    const result = reportEditService.validateReasonForDeleteInput(input)
    expect(result).toEqual([])
  })
})

describe('persistDeleteIncident', () => {
  const user = { username: 'USER' }
  const data = { reportId: 1, reasonForDelete: 'reason', reasonForDeleteText: '', changes: {} }

  it('should call deleteIncidentAndUpdateReportEdit with correct args', async () => {
    reportService.deleteIncidentAndUpdateReportEdit.mockResolvedValue(undefined)
    await expect(reportEditService.persistDeleteIncident(user, data)).resolves.toBeUndefined()
    expect(reportService.deleteIncidentAndUpdateReportEdit).toHaveBeenCalledWith(user, data)
  })

  it('should throw and log error if deleteIncidentAndUpdateReportEdit fails', async () => {
    const error = new Error('fail')
    reportService.deleteIncidentAndUpdateReportEdit.mockRejectedValue(error)
    await expect(reportEditService.persistDeleteIncident(user, data)).rejects.toThrow(
      'Could not delete incident with id 1.'
    )
    expect(reportService.deleteIncidentAndUpdateReportEdit).toHaveBeenCalledWith(user, data)
    expect(logger.error).toHaveBeenCalledWith('Report deletion failed. Report id 1', error)
  })
})

describe('isTodaysDateWithinEditabilityPeriod', () => {
  const today = new Date(2025, 10, 12) // 12 Nov 2025
  const reportId = 1
  it('returns true if incidentDate is today', async () => {
    incidentClient.getReportForReviewer.mockResolvedValue({ incidentDate: today } as Report) // 12 Nov 2025
    const result = await reportEditService.isTodaysDateWithinEditabilityPeriod(reportId, today)
    expect(result).toBe(true)
  })

  it('returns true if today is 1 day before end of edit window', async () => {
    incidentClient.getReportForReviewer.mockResolvedValue({ incidentDate: new Date(Date.UTC(2025, 7, 15)) } as Report) // edit window 15 Aug 2025 - 13 Nov 2025
    const result = await reportEditService.isTodaysDateWithinEditabilityPeriod(reportId, today)
    expect(result).toBe(true)
  })

  it('returns true if today is exactly at end of edit window', async () => {
    incidentClient.getReportForReviewer.mockResolvedValue({ incidentDate: new Date(Date.UTC(2025, 7, 14)) } as Report) // edit window 14 Aug 2025 - 12 Nov 2025
    const result = await reportEditService.isTodaysDateWithinEditabilityPeriod(reportId, today)
    expect(result).toBe(true)
  })

  it('returns false if today is 1 day after end of edit window', async () => {
    incidentClient.getReportForReviewer.mockResolvedValue({ incidentDate: new Date(Date.UTC(2025, 7, 13)) } as Report) // edit window 13 Aug 2025 - 11 Nov 2025
    const result = await reportEditService.isTodaysDateWithinEditabilityPeriod(reportId, today)
    expect(result).toBe(false)
  })
})
