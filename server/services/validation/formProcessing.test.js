const Joi = require('@hapi/joi')
const R = require('ramda')
const { processInput } = require('./formProcessing')
const { EXTRACTED } = require('../../config/fieldType')
const { validations, joi } = require('../../config/forms/validations')
const { buildValidationSpec } = require('./index')

describe('processInput', () => {
  describe('checking dependentFields functionality', () => {
    const schemas = {
      complete: joi.object({
        decision: validations.requiredOneOfMsg('Yes', 'No')('Meh'),
        followUp1: joi.when('decision', { is: 'Yes', then: joi.string().required(), otherwise: joi.any().strip() }),
        followUp2: joi.when('decision', { is: 'Yes', then: joi.string().required(), otherwise: joi.any().strip() }),
      }),
    }

    const validationSpec = buildValidationSpec(schemas.complete)

    test('should store dependents if predicate matches', async () => {
      const userInput = {
        decision: 'Yes',
        followUp1: 'County',
        followUp2: 'Town',
      }

      const output = await processInput({ validationSpec, input: userInput })

      expect(output).toEqual({
        errors: [],
        extractedFields: {},
        payloadFields: {
          decision: 'Yes',
          followUp1: 'County',
          followUp2: 'Town',
        },
      })
    })

    test('should remove dependents if predicate does not match', async () => {
      const userInput = {
        decision: 'No',
        followUp1: 'County',
        followUp2: 'Town',
      }

      const output = await processInput({ validationSpec, input: userInput })

      expect(output).toEqual({
        errors: [],
        extractedFields: {},
        payloadFields: {
          decision: 'No',
        },
      })
    })
  })

  test('check extracted fields are present outside of the payload', async () => {
    const inSchema = joi.any()
    const outSchema = joi.any().meta({ fieldType: EXTRACTED })

    const output = processInput({
      validationSpec: buildValidationSpec(
        Joi.object({
          q1: inSchema,
          q2: outSchema,
          q3: inSchema,
          q4: outSchema,
        })
      ),
      input: { q1: 'aaa', q2: 'bbb', q3: 'ccc', q4: 'ddd' },
    })

    expect(output).toEqual({
      errors: [],
      extractedFields: { q2: 'bbb', q4: 'ddd' },
      payloadFields: {
        q1: 'aaa',
        q3: 'ccc',
      },
    })
  })

  test('sanitisation', async () => {
    const output = processInput({
      validationSpec: buildValidationSpec(joi.object({ q1: joi.string().meta({ sanitiser: R.toUpper }) })),
      input: { q1: 'aaaAAAaa' },
    })

    expect(output).toEqual({
      errors: [],
      extractedFields: {},
      payloadFields: {
        q1: 'AAAAAAAA',
      },
    })
  })

  test('validation', async () => {
    const schema = joi.object({ q1: validations.requiredStringMsg('Please give a full name') })

    const output = processInput({ validationSpec: buildValidationSpec(schema), input: {} })

    expect(output).toEqual({
      errors: [
        {
          href: '#q1',
          text: 'Please give a full name',
        },
      ],
      extractedFields: {},
      payloadFields: {},
    })
  })
})
