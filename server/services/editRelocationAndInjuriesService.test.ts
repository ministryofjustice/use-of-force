import EditRelocationAndInjuriesService from './editRelocationAndInjuriesService'
import questionSets from '../config/edit/questionSets'

let editRelocationAndInjuriesService

beforeEach(() => {
  editRelocationAndInjuriesService = new EditRelocationAndInjuriesService()
})

describe('buildDetails', () => {
  it('returns the correct response when all inputs have changed', async () => {
    const changes = {
      prisonerRelocation: {
        question: 'Where was the prisoner relocated to',
        oldValue: 'RECEPTION',
        newValue: 'OWN_CELL',
      },
      relocationCompliancy: {
        question: 'Was the prisoner compliant',
        oldValue: false,
        newValue: true,
      },
      relocationType: {
        question: 'What was the type of relocation',
        oldValue: 'FULL',
      },
      f213CompletedBy: {
        question: 'Who completed the F213 form',
        oldValue: 'Mr Fowler',
        newValue: 'Mr Fowler-Smith',
      },
      prisonerInjuries: {
        question: 'Did the prisoner sustain any injuries at the time',
        oldValue: true,
        newValue: false,
      },
      healthcareInvolved: {
        question:
          'Was a member of healthcare present throughout the incident (doctor, registered nurse or healthcare officer)',
        oldValue: true,
        newValue: false,
      },
      healthcarePractionerName: {
        question: 'Name of healthcare member present ',
        oldValue: 'Dr Harold',
      },
      prisonerHospitalisation: {
        question: 'Did the prisoner need outside hospitalisation at the time',
        oldValue: true,
        newValue: false,
      },
      staffMedicalAttention: {
        question: 'Did a member of staff need medical attention at the time',
        oldValue: true,
        newValue: false,
      },
      staffNeedingMedicalAttention: {
        question: 'Name of who needed medical attention',
        oldValue: [
          {
            name: 'Tony',
            hospitalisation: false,
          },
          {
            name: 'John',
            hospitalisation: true,
          },
          {
            name: 'Harry',
            hospitalisation: true,
          },
        ],
        newValue: [
          {
            name: 'Tony',
            hospitalisation: false,
          },
          {
            name: 'John',
            hospitalisation: false,
          },
          {
            name: 'Harry',
            hospitalisation: false,
          },
        ],
      },
    }
    const expectedResult = [
      {
        question: 'Where was the prisoner relocated to',
        oldValue: 'Reception',
        newValue: 'Own cell',
      },
      {
        question: 'Was the prisoner compliant',
        oldValue: false,
        newValue: true,
      },
      {
        question: 'What was the type of relocation',
        oldValue: 'Full relocation',
        newValue: undefined,
      },
      {
        question: 'Who completed the F213 form',
        oldValue: 'Mr Fowler',
        newValue: 'Mr Fowler-Smith',
      },
      {
        question: 'Did the prisoner sustain any injuries at the time',
        oldValue: true,
        newValue: false,
      },
      {
        question:
          'Was a member of healthcare present throughout the incident (doctor, registered nurse or healthcare officer)',
        oldValue: true,
        newValue: false,
      },
      {
        question: 'Name of healthcare member present ',
        oldValue: 'Dr Harold',
        newValue: undefined,
      },
      {
        question: 'Did the prisoner need outside hospitalisation at the time',
        oldValue: true,
        newValue: false,
      },
      {
        question: 'Did a member of staff need medical attention at the time',
        oldValue: true,
        newValue: false,
      },
      {
        question: 'Name of who needed medical attention',
        oldValue: 'Tony, John (went to hosptial), Harry (went to hosptial)',
        newValue: 'Tony, John, Harry',
      },
    ]
    const result = await editRelocationAndInjuriesService.buildDetails(questionSets.relocationAndInjuries, changes)

    expect(result).toEqual(expectedResult)
  })

  it('returns the correct response when when only inputs have changed', async () => {
    const changes = {
      f213CompletedBy: {
        question: 'Who completed the F213 form',
        oldValue: 'Mr Fowler',
        newValue: 'Mr Fowler-Smith',
      },
      prisonerInjuries: {
        question: 'Did the prisoner sustain any injuries at the time',
        oldValue: true,
        newValue: false,
      },
      healthcareInvolved: {
        question:
          'Was a member of healthcare present throughout the incident (doctor, registered nurse or healthcare officer)',
        oldValue: true,
        newValue: false,
      },
      healthcarePractionerName: {
        question: 'Name of healthcare member present ',
        oldValue: 'Dr Harold',
      },
      prisonerHospitalisation: {
        question: 'Did the prisoner need outside hospitalisation at the time',
        oldValue: true,
        newValue: false,
      },
      staffMedicalAttention: {
        question: 'Did a member of staff need medical attention at the time',
        oldValue: true,
        newValue: false,
      },
      staffNeedingMedicalAttention: {
        question: 'Name of who needed medical attention',
        oldValue: [
          {
            name: 'Tony',
            hospitalisation: false,
          },
          {
            name: 'John',
            hospitalisation: true,
          },
          {
            name: 'Harry',
            hospitalisation: true,
          },
        ],
        newValue: [
          {
            name: 'Tony',
            hospitalisation: false,
          },
          {
            name: 'John',
            hospitalisation: false,
          },
          {
            name: 'Harry',
            hospitalisation: false,
          },
        ],
      },
    }
    const expectedResult = [
      {
        question: 'Who completed the F213 form',
        oldValue: 'Mr Fowler',
        newValue: 'Mr Fowler-Smith',
      },
      {
        question: 'Did the prisoner sustain any injuries at the time',
        oldValue: true,
        newValue: false,
      },
      {
        question:
          'Was a member of healthcare present throughout the incident (doctor, registered nurse or healthcare officer)',
        oldValue: true,
        newValue: false,
      },
      {
        question: 'Name of healthcare member present ',
        oldValue: 'Dr Harold',
        newValue: undefined,
      },
      {
        question: 'Did the prisoner need outside hospitalisation at the time',
        oldValue: true,
        newValue: false,
      },
      {
        question: 'Did a member of staff need medical attention at the time',
        oldValue: true,
        newValue: false,
      },
      {
        question: 'Name of who needed medical attention',
        oldValue: 'Tony, John (went to hosptial), Harry (went to hosptial)',
        newValue: 'Tony, John, Harry',
      },
    ]
    const result = await editRelocationAndInjuriesService.buildDetails(questionSets.relocationAndInjuries, changes)

    expect(result).toEqual(expectedResult)
  })
})
