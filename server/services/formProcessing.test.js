const Joi = require('@hapi/joi')
const R = require('ramda')
const { mergeIntoPayload, processInput } = require('./formProcessing')
const { EXTRACTED } = require('../config/fieldType')
const { validations, joi } = require('../config/forms/validations')
const { buildValidationSpec } = require('../utils/fieldValidation')

describe('mergeIntoPayload', () => {
  const baseForm = {
    form1: {},
    form2: { answer: 'answer' },
  }

  const form = {
    ...baseForm,
    form3: {
      decision: '',
      followUp1: '',
      followUp2: '',
    },
  }

  test('should build updated object correctly', async () => {
    const formPayload = {
      decision: 'Yes',
      followUp1: 'County',
      followUp2: 'Town',
    }

    const output = await mergeIntoPayload({
      formObject: baseForm,
      formPayload,
      formName: 'form3',
    })

    expect(output).toEqual({
      ...form,
      form3: {
        decision: 'Yes',
        followUp1: 'County',
        followUp2: 'Town',
      },
    })
  })

  test('should not return updated form object when there has been no change', async () => {
    const formPayload = { answer: 'answer' }

    const existingForm = {
      form1: {},
      form2: { answer: 'answer' },
    }

    const output = await mergeIntoPayload({
      formObject: existingForm,
      formPayload,
      formName: 'form2',
    })

    expect(output).toEqual(false)
  })

  it('should add new forms to the form if they dont exist', async () => {
    const formPayload = {
      decision: 'Yes',
      followUp1: 'County',
      followUp2: 'Town',
    }

    const output = await mergeIntoPayload({
      formObject: baseForm,
      formPayload,
      formName: 'form1',
    })

    const expectedForm = {
      ...baseForm,
      form1: {
        decision: 'Yes',
        followUp1: 'County',
        followUp2: 'Town',
      },
    }
    expect(output).toEqual(expectedForm)
  })
})

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

      const output = await processInput({ validationSpec, shouldValidate: false, input: userInput })

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

      const output = await processInput({ validationSpec, shouldValidate: false, input: userInput })

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
      shouldValidate: false,
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
      validate: false,
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

    const output = processInput({ validationSpec: buildValidationSpec(schema), validate: true, input: {} })

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
