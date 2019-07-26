const getUpdatedFormObject = require('./updateBuilder')

describe('getUpdatedFormObject', () => {
  const baseForm = {
    section1: '',
    section2: '',
    section3: {},
    section4: {
      form1: {},
      form2: { answer: 'answer' },
    },
  }

  describe('When there are no dependant fields', () => {
    const fieldMap = [{ decision: {} }, { followUp1: {} }, { followUp2: {} }]

    const form = {
      ...baseForm,
      section4: {
        ...baseForm.section4,
        form3: {
          decision: '',
          followUp1: '',
          followUp2: '',
        },
      },
    }

    test('should build updated object correctly', async () => {
      const userInput = {
        decision: 'Yes',
        followUp1: 'County',
        followUp2: 'Town',
      }

      const output = await getUpdatedFormObject({
        formObject: baseForm,
        fieldMap,
        userInput,
        formSection: 'section4',
        formName: 'form3',
      })

      expect(output).toEqual({
        ...form,
        section4: {
          ...form.section4,
          form3: {
            decision: 'Yes',
            followUp1: 'County',
            followUp2: 'Town',
          },
        },
      })
    })

    test('should not return updated form object when there has been no change', async () => {
      const fieldMapSimple = [{ answer: {} }]
      const userInput = { answer: 'answer' }

      const existingForm = {
        section1: '',
        section2: '',
        section3: {},
        section4: {
          form1: {},
          form2: { answer: 'answer' },
        },
      }

      const output = await getUpdatedFormObject({
        formObject: existingForm,
        fieldMap: fieldMapSimple,
        userInput,
        formSection: 'section4',
        formName: 'form2',
      })

      expect(output).toEqual(false)
    })

    it('should add new sections and forms to the form if they dont exist', async () => {
      const userInput = {
        decision: 'Yes',
        followUp1: 'County',
        followUp2: 'Town',
      }

      const output = await getUpdatedFormObject({
        formObject: baseForm,
        fieldMap,
        userInput,
        formSection: 'section5',
        formName: 'form1',
      })

      const expectedForm = {
        ...baseForm,
        section5: {
          form1: {
            decision: 'Yes',
            followUp1: 'County',
            followUp2: 'Town',
          },
        },
      }
      expect(output).toEqual(expectedForm)
    })
  })

  describe('When there are dependant fields', () => {
    const form = {
      ...baseForm,
      section4: {
        ...baseForm.section4,
        form3: {
          decision: '',
          followUp1: '',
          followUp2: '',
        },
      },
    }

    const fieldMap = [
      { decision: {} },
      {
        followUp1: {
          dependentOn: 'decision',
          predicate: 'Yes',
        },
      },
      {
        followUp2: {
          dependentOn: 'decision',
          predicate: 'Yes',
        },
      },
    ]

    test('should store dependents if predicate matches', async () => {
      const userInput = {
        decision: 'Yes',
        followUp1: 'County',
        followUp2: 'Town',
      }

      const formSection = 'section4'
      const formName = 'form3'

      const output = await getUpdatedFormObject({
        formObject: baseForm,
        fieldMap,
        userInput,
        formSection,
        formName,
      })

      expect(output).toEqual({
        ...form,
        section4: {
          ...form.section4,
          form3: {
            decision: 'Yes',
            followUp1: 'County',
            followUp2: 'Town',
          },
        },
      })
    })

    test('should remove dependents if predicate does not match', async () => {
      const userInput = {
        decision: 'No',
        followUp1: 'County',
        followUp2: 'Town',
      }

      const formSection = 'section4'
      const formName = 'form3'

      const output = await getUpdatedFormObject({
        formObject: baseForm,
        fieldMap,
        userInput,
        formSection,
        formName,
      })

      expect(output).toEqual({
        ...form,
        section4: {
          ...form.section4,
          form3: {
            decision: 'No',
          },
        },
      })
    })
  })
})

test('sanitisation', async () => {
  const config = [
    {
      q1: {
        responseType: 'requiredString',
        validationMessage: 'Please give a full name',
        sanitiser: val => val.toUpperCase(),
      },
    },
  ]

  const output = getUpdatedFormObject({
    formObject: {},
    fieldMap: config,
    userInput: { q1: 'aaaAAAaa' },
    formSection: 'section4',
    formName: 'form1',
  })

  expect(output).toEqual({
    section4: {
      form1: {
        q1: 'AAAAAAAA',
      },
    },
  })
})
