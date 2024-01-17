const { complete, partial } = require('./useOfForceDetailsForm')
const { processInput } = require('../../services/validation')

const checkFactory = schema => input => {
  const { payloadFields: formResponse, errors } = processInput({ validationSpec: schema, input })
  return { formResponse, errors }
}

let validInput = {}

beforeEach(() => {
  validInput = {
    positiveCommunication: 'true',
    personalProtectionTechniques: 'true',
    batonDrawn: 'true',
    batonUsed: 'true',
    pavaDrawn: 'true',
    pavaUsed: 'true',
    guidingHold: 'true',
    guidingHoldOfficersInvolved: '2',
    escortingHold: 'true',
    escortingHoldOfficersInvolved: '1',
    restraint: 'true',
    restraintPositions: ['STANDING', 'FACE_DOWN'],
    handcuffsApplied: 'true',
    painInducingTechniques: 'true',
    painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
  }
})

describe('complete schema', () => {
  const check = checkFactory(complete)

  describe('Details page - overall', () => {
    it('Should return no validation error messages if every input field completed correctly', () => {
      const { errors, formResponse } = check(validInput)

      expect(errors).toEqual([])

      expect(formResponse).toEqual({
        positiveCommunication: true,
        personalProtectionTechniques: true,
        batonDrawn: true,
        batonUsed: true,
        pavaDrawn: true,
        pavaUsed: true,
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        escortingHold: true,
        escortingHoldOfficersInvolved: 1,
        restraint: true,
        restraintPositions: ['STANDING', 'FACE_DOWN'],
        handcuffsApplied: true,
        painInducingTechniques: true,
        painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
      })
    })

    it('Should return 8 error massages if no input field is completed', () => {
      const input = {}
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#positiveCommunication',
          text: 'Select yes if positive communication was used',
        },
        {
          href: '#personalProtectionTechniques',
          text: 'Select yes if any personal protection techniques were used',
        },
        {
          href: '#batonDrawn',
          text: 'Select yes if a baton was drawn',
        },
        {
          href: '#pavaDrawn',
          text: 'Select yes if PAVA was drawn',
        },
        {
          href: '#guidingHold',
          text: 'Select yes if a guiding hold was used',
        },
        {
          href: '#escortingHold',
          text: 'Select yes if an escorting hold was used',
        },
        {
          href: '#restraint',
          text: 'Select yes if control and restraint was used',
        },
        {
          href: '#painInducingTechniques',
          text: 'Select yes if pain inducing techniques were used',
        },
        {
          href: '#handcuffsApplied',
          text: 'Select yes if handcuffs were applied',
        },
      ])

      expect(errors.length).toEqual(9)

      expect(formResponse).toEqual({})
    })
  })

  describe('Details page inputs', () => {
    it("Not selecting an option for 'positive communication' returns a validation error message", () => {
      const input = {
        ...validInput,
        positiveCommunication: undefined,
      }
      const { errors } = check(input)
      expect(errors).toEqual([
        {
          href: '#positiveCommunication',
          text: 'Select yes if positive communication was used',
        },
      ])
    })

    it("Not selecting an option for 'personal protection techniques' returns a validation error message", () => {
      const input = {
        ...validInput,
        personalProtectionTechniques: undefined,
      }
      const { errors } = check(input)
      expect(errors).toEqual([
        {
          href: '#personalProtectionTechniques',
          text: 'Select yes if any personal protection techniques were used',
        },
      ])
    })

    it("Not selecting an option for 'baton drawn' returns validation error message plus Baton Used is undefined", () => {
      const input = {
        ...validInput,
        batonDrawn: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#batonDrawn',
          text: 'Select yes if a baton was drawn',
        },
      ])
      expect(formResponse.batonDrawn).toBe(undefined)
      expect(formResponse.batonUsed).toBe(undefined)
    })

    it("Selecting Yes to 'baton drawn' but nothing for 'baton used' returns a  validation error messaged", () => {
      const input = {
        ...validInput,
        batonUsed: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#batonUsed',
          text: 'Select yes if a baton was used',
        },
      ])
      expect(formResponse.batonDrawn).toEqual(true)
      expect(formResponse.batonUsed).toBe(undefined)
    })

    it("Not selecting an option for 'pava drawn' returns validation error message plus 'pava used' is undefined", () => {
      const input = {
        ...validInput,
        pavaDrawn: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#pavaDrawn',
          text: 'Select yes if PAVA was drawn',
        },
      ])
      expect(formResponse.pavaDrawn).toEqual(undefined)
      expect(formResponse.pavaUsed).toBe(undefined)
    })

    it("Selecting Yes to 'pava drawn' but nothing for 'pava used' returns a validation error message", () => {
      const input = {
        ...validInput,
        pavaUsed: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#pavaUsed',
          text: 'Select yes if PAVA was used',
        },
      ])
      expect(formResponse.pavaDrawn).toEqual(true)
      expect(formResponse.pavaUsed).toBe(undefined)
    })

    it("Not selecting an option for 'guiding hold' returns validation error message plus 'how many officers involved' is undefined", () => {
      const input = {
        ...validInput,
        guidingHold: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#guidingHold',
          text: 'Select yes if a guiding hold was used',
        },
      ])
      expect(formResponse.guidingHold).toEqual(undefined)
      expect(formResponse.guidingHoldOfficersInvolved).toBe(undefined)
    })

    it("Selecting Yes to 'guiding hold' but nothing for 'how many officers were involved' returns a validation error message", () => {
      const input = {
        ...validInput,
        guidingHoldOfficersInvolved: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#guidingHoldOfficersInvolved',
          text: 'Select how many officers were involved in the guiding hold',
        },
      ])
      expect(formResponse.guidingHold).toEqual(true)
      expect(formResponse.guidingHoldOfficersInvolved).toBe(undefined)
    })

    it("Selecting 2 for 'how many officers were involved' return no errors", () => {
      const input = {
        ...validInput,
        guidingHoldOfficersInvolved: '2',
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse.guidingHold).toEqual(true)
      expect(formResponse.guidingHoldOfficersInvolved).toEqual(2)
    })

    it("Not selecting an option for 'escorting hold' returns validation error message plus 'how many officers involved' is undefined", () => {
      const input = {
        ...validInput,
        escortingHold: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#escortingHold',
          text: 'Select yes if an escorting hold was used',
        },
      ])
      expect(formResponse.escortingHold).toEqual(undefined)
      expect(formResponse.escortingHoldOfficersInvolved).toBe(undefined)
    })

    it("Selecting Yes to 'escorting hold' but nothing for 'how many officers were involved' returns a validation error message", () => {
      const input = {
        ...validInput,
        escortingHoldOfficersInvolved: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#escortingHoldOfficersInvolved',
          text: 'Select how many officers were involved in the escorting hold',
        },
      ])
      expect(formResponse.escortingHold).toEqual(true)
      expect(formResponse.escortingHoldOfficersInvolved).toBe(undefined)
    })

    it("Selecting 1 for 'how many officers were involved' return no errors", () => {
      const input = {
        ...validInput,
        escortingHoldOfficersInvolved: '1',
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse.escortingHold).toEqual(true)
      expect(formResponse.escortingHoldOfficersInvolved).toEqual(1)
    })

    it("Not selecting an option for 'restraint'returns a validation error message plus 'restraint positions' is undefined", () => {
      const input = {
        ...validInput,
        restraint: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#restraint',
          text: 'Select yes if control and restraint was used',
        },
      ])
      expect(formResponse.restraint).toBe(undefined)
      expect(formResponse.restraintPositions).toBe(undefined)
    })

    it("Selecting Yes to 'restraint' but nothing for 'restraint positions' returns a validation error message", () => {
      const input = {
        ...validInput,
        restraintPositions: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#restraintPositions',
          text: 'Select the control and restraint positions used',
        },
      ])
      expect(formResponse.restraint).toEqual(true)
      expect(formResponse.restraintPositions).toBe(undefined)
    })

    it("Selecting just 1 option for 'restraint positions' returns no errors", () => {
      const input = {
        ...validInput,
        restraintPositions: ['KNEELING'],
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse.restraint).toBe(true)
      expect(formResponse.restraintPositions).toEqual(['KNEELING'])
    })

    it("Selecting 'Standing' and 'Face Down' for 'restraint positions' returns no errors", () => {
      const input = {
        ...validInput,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse.restraint).toEqual(true)
      expect(formResponse.restraintPositions).toEqual(['STANDING', 'FACE_DOWN'])
    })

    it("Not selecting an option for 'handcuffs applied' returns a validation error message", () => {
      const input = {
        ...validInput,
        handcuffsApplied: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#handcuffsApplied',
          text: 'Select yes if handcuffs were applied',
        },
      ])
      expect(formResponse.handcuffsAplied).toBe(undefined)
    })

    it("Not selecting Yes or No for 'pain inducing techniques used' radio returns a validation error message", () => {
      const input = {
        ...validInput,
        painInducingTechniques: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#painInducingTechniques',
          text: 'Select yes if pain inducing techniques were used',
        },
      ])
      expect(formResponse.painInducingTechniques).toBe(undefined)
    })

    it("Selecting Yes to 'pain inducing techniques used' radio  but nothing for 'techniques' checkboxes returns a validation error message", () => {
      const input = {
        ...validInput,
        painInducingTechniques: 'true',
        painInducingTechniquesUsed: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#painInducingTechniquesUsed',
          text: 'Select the pain inducing techniques used',
        },
      ])
      expect(formResponse.painInducingTechniques).toEqual(true)
      expect(formResponse.painInducingTechniquesUsed).toBe(undefined)
    })

    it("Selecting just 1 option for 'pain inducing techniques' returns no errors", () => {
      const input = {
        ...validInput,
        painInducingTechniques: 'true',
        painInducingTechniquesUsed: ['THUMB_LOCK'],
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse.painInducingTechniques).toBe(true)
      expect(formResponse.painInducingTechniquesUsed).toEqual(['THUMB_LOCK'])
    })

    it('Selecting more than 1 option for pain inducing techniques returns no errors', () => {
      const input = {
        ...validInput,
        painInducingTechniques: 'true',
        painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse.painInducingTechniques).toEqual(true)
      expect(formResponse.painInducingTechniquesUsed).toEqual(['FINAL_LOCK_FLEXION', 'THUMB_LOCK'])
    })
  })
})

describe('partial schema', () => {
  const check = checkFactory(partial)

  describe('Details page - overall', () => {
    it('Should return no validation error messages if every input field completed correctly', () => {
      const { errors, formResponse } = check(validInput)

      expect(errors).toEqual([])

      expect(formResponse).toEqual({
        positiveCommunication: true,
        personalProtectionTechniques: true,
        batonDrawn: true,
        batonUsed: true,
        pavaDrawn: true,
        pavaUsed: true,
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        escortingHold: true,
        escortingHoldOfficersInvolved: 1,
        restraint: true,
        restraintPositions: ['STANDING', 'FACE_DOWN'],
        handcuffsApplied: true,
        painInducingTechniques: true,
        painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
      })
    })

    it('Should return no error massages if no input field is completed', () => {
      const input = {}
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse).toEqual({})
    })
  })

  it('Should return no error massages when dependent answers are absent', () => {
    const { errors, formResponse } = check({
      batonDrawn: 'true',
      pavaDrawn: 'true',
      guidingHold: 'true',
      escortingHold: 'true',
      restraint: 'true',
      restraintPositions: [],
    })

    expect(errors).toEqual([])
    expect(formResponse).toEqual({
      batonDrawn: true,
      guidingHold: true,
      escortingHold: true,
      pavaDrawn: true,
      restraint: true,
    })
  })
})
