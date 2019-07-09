const serviceCreator = require('./formService')

const formClient = {
  getFormDataForUser: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
}
let service

beforeEach(() => {
  service = serviceCreator(formClient)
  formClient.getFormDataForUser.mockReturnValue({ rows: [{ a: 'b' }, { c: 'd' }] })
})

afterEach(() => {
  formClient.getFormDataForUser.mockReset()
  formClient.update.mockReset()
  formClient.create.mockReset()
})

describe('getFormResponse', () => {
  test('it should call query on db', async () => {
    await service.getFormResponse('user1')
    expect(formClient.getFormDataForUser).toBeCalledTimes(1)
  })

  test('it should return the first row', async () => {
    const output = await service.getFormResponse('user1')
    expect(output).toEqual({ a: 'b' })
  })
})

describe('update', () => {
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

    test('should store everything', async () => {
      const userInput = {
        decision: 'Yes',
        followUp1: 'County',
        followUp2: 'Town',
      }

      const output = await service.update({
        bookingId: 1,
        userId: 'user1',
        formId: 'form1',
        formObject: baseForm,
        config: { fields: fieldMap },
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

    test('should call update and pass in the form', async () => {
      const userInput = {
        decision: 'Yes',
        followUp1: 'County',
        followUp2: 'Town',
      }

      const output = await service.update({
        bookingId: 1,
        userId: 'user1',
        formId: 'form1',
        formObject: baseForm,
        config: { fields: fieldMap },
        userInput,
        formSection: 'section4',
        formName: 'form3',
      })

      expect(formClient.update).toBeCalledTimes(1)
      expect(formClient.update).toBeCalledWith('form1', output)
    })

    test('should call create when form id not present', async () => {
      const userInput = {
        decision: 'Yes',
        followUp1: 'County',
        followUp2: 'Town',
      }

      await service.update({
        bookingId: 1,
        userId: 'user1',
        formObject: {},
        config: { fields: fieldMap },
        userInput,
        formSection: 'section4',
        formName: 'form3',
      })

      expect(formClient.create).toBeCalledTimes(1)
      expect(formClient.create).toBeCalledWith('user1', 1, {
        section4: {
          form3: userInput,
        },
      })
    })

    test('should not call update if there are no changes', async () => {
      const fieldMapSimple = [{ answer: {} }]
      const userInput = { answer: 'answer' }

      const output = await service.update({
        bookingId: 1,
        userId: 'user1',
        formId: 'form1',
        formObject: baseForm,
        config: { fields: fieldMapSimple },
        userInput,
        formSection: 'section4',
        formName: 'form2',
      })

      expect(formClient.update).toBeCalledTimes(0)
      expect(output).toEqual(baseForm)
    })

    it('should add new sections and forms to the licence if they dont exist', async () => {
      const userInput = {
        decision: 'Yes',
        followUp1: 'County',
        followUp2: 'Town',
      }

      const output = await service.update({
        bookingId: 1,
        userId: 'user1',
        formId: 'form1',
        formObject: baseForm,
        config: { fields: fieldMap },
        userInput,
        formSection: 'section5',
        formName: 'form1',
      })

      const expectedLicence = {
        ...baseForm,
        section5: {
          form1: {
            decision: 'Yes',
            followUp1: 'County',
            followUp2: 'Town',
          },
        },
      }
      expect(output).toEqual(expectedLicence)
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

      const output = await service.update({
        bookingId: 1,
        userId: 'user1',
        formId: 'form1',
        formObject: baseForm,
        config: { fields: fieldMap },
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

      const output = await service.update({
        bookingId: 1,
        userId: 'user1',
        formId: 'form1',
        formObject: baseForm,
        config: { fields: fieldMap },
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

describe('getValidationErrors', () => {
  const dependantConfig = {
    fields: [
      {
        q1: {
          responseType: 'requiredString',
          validationMessage: 'Please give a full name',
        },
      },
      {
        q2: {
          responseType: 'requiredYesNoIf_q1_Yes',
          validationMessage: 'Error q2',
        },
      },
    ],
  }

  test.each`
    formBody         | formConfig         | expectedOutput
    ${{ q1: 'Yes' }} | ${dependantConfig} | ${[{ href: '#q2', text: 'Error q2' }]}
    ${{ q1: 'No' }}  | ${dependantConfig} | ${[]}
  `('should return errors $expectedContent for form return', ({ formBody, formConfig, expectedOutput }) => {
    expect(service.getValidationErrors(formBody, formConfig)).toEqual(expectedOutput)
  })

  test('sanitisation', async () => {
    const config = {
      fields: [
        {
          q1: {
            responseType: 'requiredString',
            validationMessage: 'Please give a full name',
            sanitiser: val => val.toUpperCase(),
          },
        },
      ],
    }
    const output = await service.update({
      bookingId: 1,
      userId: 'user1',
      formId: 'form1',
      formObject: {},
      config,
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
})
