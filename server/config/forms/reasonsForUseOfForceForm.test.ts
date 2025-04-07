import reasonsForUseOfForceForm from './reasonsForUseOfForceForm'
import validation from '../../services/validation'
import { UofReasons } from '../types'
const { processInput } = validation

const { complete } = reasonsForUseOfForceForm

const buildCheck = schema => input => {
  const {
    payloadFields: formResponse,
    errors,
    extractedFields,
  } = processInput({
    validationSpec: schema,
    input,
  })
  return { formResponse, errors, extractedFields }
}

describe('validation', () => {
  const check = buildCheck(complete)
  test('complete with single value', () => {
    const { errors, formResponse, extractedFields } = check({
      reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value],
    })

    expect(errors).toEqual([])

    expect(extractedFields).toEqual({})
    expect(formResponse).toEqual({
      reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value],
    })
  })

  test('complete with multi values', () => {
    const { errors, formResponse, extractedFields } = check({
      reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value, UofReasons.VERBAL_THREAT.value],
      primaryReason: UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value,
    })

    expect(errors).toEqual([])

    expect(extractedFields).toEqual({})
    expect(formResponse).toEqual({
      reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value, UofReasons.VERBAL_THREAT.value],
      primaryReason: UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value,
    })
  })

  test('Should return error massage if no reasons are selected', () => {
    const input = {}
    const { errors, formResponse, extractedFields } = check(input)

    expect(errors).toEqual([
      {
        href: '#reasons',
        text: '"reasons" is required',
      },
    ])

    expect(formResponse).toEqual({})
    expect(extractedFields).toEqual({})
  })

  it('Should return error massage if multiple reasons are selected but no primary reason', () => {
    const input = {
      reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value, UofReasons.VERBAL_THREAT.value],
    }
    const { errors, formResponse, extractedFields } = check(input)

    expect(errors).toEqual([{ href: '#primaryReason', text: '"primaryReason" is required' }])

    expect(formResponse).toEqual({ reasons: ['ASSAULT_ON_ANOTHER_PRISONER', 'VERBAL_THREAT'] })
    expect(extractedFields).toEqual({})
  })
})
