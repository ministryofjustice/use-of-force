const joi = require('@hapi/joi')
const form = require('./relocationAndInjuriesForm')
const formProcessing = require('../../services/formProcessing')
const { isValid, validate } = require('../../utils/fieldValidation')

const check = input => {
  const { payloadFields: formResponse, errors } = formProcessing.processInput({ formConfig: form.formConfig, input })
  return { formResponse, errors }
}

let validInput = {}

beforeEach(() => {
  validInput = {
    prisonerRelocation: 'SEGREGATION_UNIT',
    relocationCompliancy: 'true',
    healthcareInvolved: 'true',
    healthcarePractionerName: 'Dr. Jones',
    f213CompletedBy: 'Jane Smith',
    prisonerInjuries: 'true',
    prisonerHospitalisation: 'true',
    staffMedicalAttention: 'true',
    staffNeedingMedicalAttention: [{ name: 'Person Someone', hospitalisation: 'true' }],
  }
})

describe('Relocation and Injuries page - overall', () => {
  it('Should return no validation error messages if every primary input field completed correctly', () => {
    const input = validInput
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      prisonerRelocation: 'SEGREGATION_UNIT',
      relocationCompliancy: true,
      healthcareInvolved: true,
      healthcarePractionerName: 'Dr. Jones',
      f213CompletedBy: 'Jane Smith',
      prisonerInjuries: true,
      prisonerHospitalisation: true,
      staffMedicalAttention: true,
      staffNeedingMedicalAttention: [{ name: 'Person Someone', hospitalisation: true }],
    })
  })

  it('Should return 7 error massages if no input field is completed', () => {
    const input = {}
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#prisonerRelocation',
        text: 'Select where the prisoner was relocated to',
      },
      {
        href: '#relocationCompliancy',
        text: 'Select yes if the prisoner was compliant',
      },
      {
        href: '#f213CompletedBy',
        text: 'Enter the name of who completed the F213 form',
      },
      {
        href: '#prisonerInjuries',
        text: 'Select yes if the prisoner sustained any injuries',
      },
      {
        href: '#healthcareInvolved',
        text: 'Select yes if a member of healthcare was present during the incident',
      },
      {
        href: '#prisonerHospitalisation',
        text: 'Select yes if the prisoner needed outside hospitalisation',
      },
      {
        href: '#staffMedicalAttention',
        text: 'Select yes if a staff member needed medical attention',
      },
    ])

    expect(errors.length).toEqual(7)

    expect(formResponse).toEqual({})
  })
})

describe('Relocation and Injuries page inputs', () => {
  it('Not selecting an option for prisoner relocation returns a validation error message', () => {
    const input = {
      ...validInput,
      prisonerRelocation: undefined,
    }
    const { errors } = check(input)
    expect(errors).toEqual([
      {
        href: '#prisonerRelocation',
        text: 'Select where the prisoner was relocated to',
      },
    ])
  })

  it('Not selecting an option for Was the prisoner compliant returns a validation error message', () => {
    const input = {
      ...validInput,
      relocationCompliancy: undefined,
    }
    const { errors } = check(input)
    expect(errors).toEqual([
      {
        href: '#relocationCompliancy',
        text: 'Select yes if the prisoner was compliant',
      },
    ])
  })

  it('Not entering anything in the Who completed the F213 form field returns a validation error message', () => {
    const input = {
      ...validInput,
      f213CompletedBy: '',
    }
    const { errors } = check(input)
    expect(errors).toEqual([
      {
        href: '#f213CompletedBy',
        text: 'Enter the name of who completed the F213 form',
      },
    ])
  })

  it('Entering a single space in the Who completed the F213 form field returns a validation error object containing two error messages', () => {
    const input = {
      ...validInput,
      f213CompletedBy: ' ',
    }
    const { errors } = check(input)
    expect(errors).toEqual([
      {
        href: '#f213CompletedBy',
        text: 'Enter the name of who completed the F213 form',
      },
    ])
  })

  it('Not selecting an option for Did the prisoner sustain any injuries returns a validation error message', () => {
    const input = {
      ...validInput,
      prisonerInjuries: undefined,
    }
    const { errors } = check(input)
    expect(errors).toEqual([
      {
        href: '#prisonerInjuries',
        text: 'Select yes if the prisoner sustained any injuries',
      },
    ])
  })

  it('Not selecting an option for Was a member of healthcare present returns validation error message plus healthcarePractionerName is undefined', () => {
    const input = {
      ...validInput,
      healthcareInvolved: undefined,
    }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#healthcareInvolved',
        text: 'Select yes if a member of healthcare was present during the incident',
      },
    ])
    expect(formResponse.healthcareInvolved).toBe(undefined)
    expect(formResponse.healthcarePractionerName).toBe(undefined)
  })

  it('Selecting Yes for Was a member of healthcare present but nothing in healthcarePractionerName returns validation error message', () => {
    const input = {
      ...validInput,
      healthcareInvolved: 'true',
      healthcarePractionerName: undefined,
    }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#healthcarePractionerName',
        text: 'Enter the name of the member of healthcare',
      },
    ])
    expect(formResponse.healthcareInvolved).toEqual(true)
    expect(formResponse.healthcarePractionerName).toBe(undefined)
  })

  it('Selecting Yes for Was a member of healthcare present and single space in healthcarePractionerName returns a validation error object containing two error messages', () => {
    const input = {
      ...validInput,
      healthcareInvolved: 'true',
      healthcarePractionerName: ' ',
    }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#healthcarePractionerName',
        text: 'Enter the name of the member of healthcare',
      },
    ])
    expect(formResponse.healthcareInvolved).toEqual(true)
    expect(formResponse.healthcarePractionerName).toBe(undefined)
  })

  it('Not selecting an option for Did the prisoner need outside hospitalisation returns a validation error message', () => {
    const input = {
      ...validInput,
      prisonerHospitalisation: undefined,
    }
    const { errors } = check(input)
    expect(errors).toEqual([
      {
        href: '#prisonerHospitalisation',
        text: 'Select yes if the prisoner needed outside hospitalisation',
      },
    ])
  })

  it('Not selecting an option for Did a member of staff need medical attention returns a  validation error message', () => {
    const input = {
      ...validInput,
      staffMedicalAttention: undefined,
    }
    const { errors } = check(input)

    expect(errors).toEqual([
      {
        href: '#staffMedicalAttention',
        text: 'Select yes if a staff member needed medical attention',
      },
    ])
  })

  it('Selecting Yes for Did a member of staff need medical attention but not inputting anything in the subsequent input fields returns a  validation error message', () => {
    const input = {
      ...validInput,
      staffNeedingMedicalAttention: [],
    }
    const { errors } = check(input)

    expect(errors).toEqual([
      {
        href: '#staffMedicalAttention',
        text: "Enter the staff member's name and whether they went to hospital",
      },
    ])
  })

  it('Selecting Yes for Did a member of staff need medical attention and inputting a string for Name of who needed medical attention but not selecting subsequent radio button  returns a  validation error message', () => {
    const input = {
      ...validInput,
      staffNeedingMedicalAttention: [{ name: 'Person Someone', hospitalisation: undefined }],
    }
    const { errors } = check(input)

    expect(errors).toEqual([
      {
        href: '#staffNeedingMedicalAttention[0][hospitalisation]',
        text: 'Select yes if the staff member had to go to hospital',
      },
    ])
  })

  it('Selecting Yes for Did a member of staff need medical attention and selecting subsequent a radio button for Did they go to hospital  but then nothing for Name of who needed medical attention returns a validation error message', () => {
    const input = {
      ...validInput,
      staffNeedingMedicalAttention: [{ name: undefined, hospitalisation: 'false' }],
    }
    const { errors } = check(input)

    expect(errors).toEqual([
      {
        href: '#staffNeedingMedicalAttention[0][name]',
        text: 'Enter the name of who needed medical attention',
      },
    ])
  })

  it('Selecting Yes for Did a member of staff need medical attention and selecting subsequent a radio button for Did they go to hospital  but then a single space for Name of who needed medical attention returns a validation error message', () => {
    const input = {
      ...validInput,
      staffNeedingMedicalAttention: [{ name: ' ', hospitalisation: 'false' }],
    }
    const { errors } = check(input)

    expect(errors).toEqual([
      {
        href: '#staffNeedingMedicalAttention[0][name]',
        text: 'Enter the name of who needed medical attention',
      },
    ])
  })

  it('Staff needing medical attention throws error when staffname format incorrect', () => {
    const input = { ...validInput, staffNeedingMedicalAttention: [{ name: 'Staff name 9', hospitalisation: 'true' }] }
    const { errors } = check(input)
    expect(errors).toEqual([
      {
        href: '#staffNeedingMedicalAttention[0][name]',
        text: 'Names may only contain letters, spaces, hyphens or apostrophes',
      },
    ])
  })

  it('Staff needing medical attention - duplicate staff names throws error', () => {
    const input = {
      ...validInput,
      staffNeedingMedicalAttention: [
        { name: 'Eric Idle', hospitalisation: 'true' },
        { name: ' eric Idle ', hospitalisation: 'true' },
      ],
    }
    const { errors } = check(input)
    expect(errors).toEqual([
      {
        href: '#staffNeedingMedicalAttention[1]',
        text: "Name 'eric Idle' has already been added - remove this name",
      },
    ])
  })

  it('Selecting Yes for Was a member of healthcare present but using wrong format for  healthcarePractionerName  throws an error', () => {
    const input = {
      ...validInput,
      healthcareInvolved: 'true',
      healthcarePractionerName: 'Jim Smith 99',
    }
    const { errors, formResponse } = check(input)
    expect(formResponse.healthcareInvolved).toEqual(true)
    expect(errors).toEqual([
      {
        href: '#healthcarePractionerName',
        text: 'Names may only contain letters, spaces, hyphens or apostrophes',
      },
    ])
  })
})

describe('name pattern (f213CompletedBy)', () => {
  const fields = [
    {
      f213CompletedBy: {
        validationMessage: {
          'string.pattern.name': 'Names may only contain letters, spaces, hyphens or apostrophes',
          'string.base': 'Enter the name of who completed the F213 form',
        },
      },
    },
  ]

  const { f213CompletedBy } = form

  it('matching value succeeds', () => {
    expect(isValid(f213CompletedBy, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe(true)
    expect(isValid(f213CompletedBy, 'abcdefghijklmnopqrstuvwxyz')).toBe(true)
    expect(isValid(f213CompletedBy, 'aa')).toBe(true)
    expect(isValid(f213CompletedBy, "a- .'a")).toBe(true)
  })

  it('failures', () => {
    expect(isValid(f213CompletedBy, '')).toBe(false)
    expect(isValid(f213CompletedBy, ' ')).toBe(false)
    expect(isValid(f213CompletedBy, 'a')).toBe(false)
    expect(isValid(f213CompletedBy, '-a')).toBe(false)
    expect(isValid(f213CompletedBy, ' a')).toBe(false)
    expect(isValid(f213CompletedBy, '.a')).toBe(false)
  })

  it('should accept a valid f213CompletedBy value', () => {
    expect(
      validate(fields, joi.object({ f213CompletedBy }), { f213CompletedBy: 'ABCDEFGHIJKLM NOPQRSTUVWXYZ' })
    ).toEqual([])
  })

  it('should reject an invalid f213CompletedBy value', () => {
    expect(validate(fields, joi.object({ f213CompletedBy }), { f213CompletedBy: '' })).toEqual([
      {
        href: '#f213CompletedBy',
        text: {
          'string.base': 'Enter the name of who completed the F213 form',
          'string.pattern.name': 'Names may only contain letters, spaces, hyphens or apostrophes',
        },
      },
    ])
  })
})
