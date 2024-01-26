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
    bodyWornCamera: 'NO',
    personalProtectionTechniques: 'true',
    batonDrawn: 'true',
    batonUsed: 'true',
    pavaDrawn: 'true',
    pavaUsed: 'true',
    weaponsSeen: 'NO',
    guidingHold: 'true',
    guidingHoldOfficersInvolved: '2',
    escortingHold: 'true',
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
        bodyWornCamera: 'NO',
        personalProtectionTechniques: true,
        batonDrawn: true,
        batonUsed: true,
        pavaDrawn: true,
        pavaUsed: true,
        weaponsSeen: 'NO',
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        escortingHold: true,
        restraintPositions: ['STANDING', 'FACE_DOWN'],
        handcuffsApplied: true,
        painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
      })
    })

    it('Should return 11 error messages if no input field is completed', () => {
      const input = {}
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#positiveCommunication',
          text: 'Select yes if positive communication was used',
        },
        {
          href: '#bodyWornCamera',
          text: 'Select yes if any part of the incident was captured on a body-worn camera',
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
          href: '#weaponsSeen',
          text: 'Select yes if any weapons were observed',
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
          href: '#restraintPositions',
          text: 'Select which control and restraint positions were used',
        },
        {
          href: '#painInducingTechniquesUsed',
          text: 'Select if any pain inducing techniques were used',
        },
        {
          href: '#handcuffsApplied',
          text: 'Select yes if handcuffs were applied',
        },
      ])

      expect(errors.length).toEqual(11)

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

    it("Not selecting an option for 'body worn cameras' returns a validation error message", () => {
      const input = {
        ...validInput,
        bodyWornCamera: undefined,
      }
      const { errors } = check(input)
      expect(errors).toEqual([
        {
          href: '#bodyWornCamera',
          text: 'Select yes if any part of the incident was captured on a body-worn camera',
        },
      ])
    })

    it('Not adding camera numbers but selecting YES for bodyWornCameras returns validation error messages', () => {
      validInput.bodyWornCamera = 'YES'
      const { errors } = check(validInput)

      expect(errors).toEqual([{ href: '#bodyWornCameraNumbers[0]', text: '"bodyWornCameraNumbers" is required' }])
    })

    it('Should return validation error if more than one body-worn camera with same identifier', () => {
      validInput.bodyWornCamera = 'YES'
      validInput.bodyWornCameraNumbers = [{ cameraNum: '1' }, { cameraNum: '1' }]
      const { errors } = check(validInput)

      expect(errors).toEqual([
        { href: '#bodyWornCameraNumbers[1]', text: "Camera '1' has already been added - remove this camera" },
      ])
    })

    it('Should not return validation error if all body-worn camera identifiers are unique', () => {
      validInput.bodyWornCamera = 'YES'
      validInput.bodyWornCameraNumbers = [{ cameraNum: '1' }, { cameraNum: '2' }]
      const { errors } = check(validInput)

      expect(errors).toEqual([])
    })

    it('Should trim empty-string body-worn camera identifiers', () => {
      validInput.bodyWornCamera = 'YES'
      validInput.bodyWornCameraNumbers = [
        { cameraNum: '    AAA  ', age: '29' },
        { cameraNum: '' },
        { cameraNum: 'BBB' },
      ]

      const { errors, formResponse } = check(validInput)

      expect(errors).toEqual([])

      expect(formResponse).toEqual({
        batonDrawn: true,
        batonUsed: true,
        bodyWornCamera: 'YES',
        bodyWornCameraNumbers: [
          {
            cameraNum: 'AAA',
          },
          {
            cameraNum: 'BBB',
          },
        ],
        escortingHold: true,
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        handcuffsApplied: true,
        painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
        pavaDrawn: true,
        pavaUsed: true,
        weaponsSeen: 'NO',
        personalProtectionTechniques: true,
        positiveCommunication: true,
        restraintPositions: ['STANDING', 'FACE_DOWN'],
      })
    })

    it('Body-worn camera identifiers are removed when bodyWornCamera is NO', () => {
      validInput.bodyWornCamera = 'NO'
      validInput.bodyWornCameraNumbers = [{ cameraNum: 'AAA' }, { cameraNum: '' }, { cameraNum: 'AAA' }]

      const { errors, formResponse } = check(validInput)

      expect(errors).toEqual([])

      expect(formResponse).toEqual({
        batonDrawn: true,
        batonUsed: true,
        bodyWornCamera: 'NO',
        escortingHold: true,
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        handcuffsApplied: true,
        painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
        pavaDrawn: true,
        pavaUsed: true,
        weaponsSeen: 'NO',
        personalProtectionTechniques: true,
        positiveCommunication: true,
        restraintPositions: ['STANDING', 'FACE_DOWN'],
      })
    })

    it('Body worn camera field must be one of allowed values', () => {
      validInput.bodyWornCamera = 'SOMETHING_RANDOM'
      validInput.bodyWornCameraNumbers = [{ cameraNum: 'AAA' }, { cameraNum: '' }, { cameraNum: 'AAA' }]
      const { errors, formResponse } = check(validInput)

      expect(errors).toEqual([
        {
          href: '#bodyWornCamera',
          text: 'Select yes if any part of the incident was captured on a body-worn camera',
        },
      ])

      expect(formResponse).toEqual({
        batonDrawn: true,
        batonUsed: true,
        bodyWornCamera: 'SOMETHING_RANDOM',
        escortingHold: true,
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        handcuffsApplied: true,
        painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
        pavaDrawn: true,
        pavaUsed: true,
        weaponsSeen: 'NO',
        personalProtectionTechniques: true,
        positiveCommunication: true,
        restraintPositions: ['STANDING', 'FACE_DOWN'],
      })
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
    })

    it("Selecting nothing for 'restraint positions' returns a validation error message", () => {
      const input = {
        ...validInput,
        restraintPositions: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#restraintPositions',
          text: 'Select which control and restraint positions were used',
        },
      ])
      expect(formResponse.restraintPositions).toBe(undefined)
    })

    it("Selecting just 1 option for 'restraint positions' returns no errors", () => {
      const input = {
        ...validInput,
        restraintPositions: ['KNEELING'],
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse.restraintPositions).toEqual(['KNEELING'])
    })

    it("Selecting 'Standing' and 'Face Down' for 'restraint positions' returns no errors", () => {
      const input = {
        ...validInput,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse.restraintPositions).toEqual(['STANDING', 'FACE_DOWN'])
    })

    it("Selecting 'Standing' and child option 'Wrist hold' for 'restraint positions' returns no errors", () => {
      const input = {
        ...validInput,
        restraintPositions: ['STANDING', 'STANDING__WRIST_HOLD'],
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse.restraintPositions).toEqual(['STANDING', 'STANDING__WRIST_HOLD'])
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

    it("Selecting nothing for 'pain inducing techniques' checkboxes returns a validation error message", () => {
      const input = {
        ...validInput,
        painInducingTechniquesUsed: undefined,
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#painInducingTechniquesUsed',
          text: 'Select if any pain inducing techniques were used',
        },
      ])
      expect(formResponse.painInducingTechniquesUsed).toBe(undefined)
    })

    it("Selecting just 1 option for 'pain inducing techniques' returns no errors", () => {
      const input = {
        ...validInput,
        painInducingTechniquesUsed: ['THUMB_LOCK'],
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse.painInducingTechniquesUsed).toEqual(['THUMB_LOCK'])
    })

    it('Selecting more than 1 option for pain inducing techniques returns no errors', () => {
      const input = {
        ...validInput,
        painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
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
        bodyWornCamera: 'NO',
        personalProtectionTechniques: true,
        batonDrawn: true,
        batonUsed: true,
        pavaDrawn: true,
        pavaUsed: true,
        weaponsSeen: 'NO',
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        escortingHold: true,
        restraintPositions: ['STANDING', 'FACE_DOWN'],
        handcuffsApplied: true,
        painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
      })
    })

    it('Should return no error messages if no input field is completed', () => {
      const input = {}
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse).toEqual({})
    })
  })

  it('Should return no error messages when dependent answers are absent', () => {
    const { errors, formResponse } = check({
      batonDrawn: 'true',
      pavaDrawn: 'true',
      guidingHold: 'true',
      escortingHold: 'true',
      restraintPositions: 'NONE',
    })

    expect(errors).toEqual([])
    expect(formResponse).toEqual({
      batonDrawn: true,
      guidingHold: true,
      escortingHold: true,
      pavaDrawn: true,
      restraintPositions: 'NONE',
    })
  })
  it('Selecting only a child control technique returns a validation error message', () => {
    const input = {
      ...validInput,
      restraintPositions: 'STANDING__WRIST_HOLD',
    }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#restraintPositions',
        text: 'Select which control and restraint positions were used',
      },
    ])
    expect(formResponse.restraintPositions).toBe('STANDING__WRIST_HOLD')
  })

  it("Not selecting an option for 'weaponsSeen' returns a validation error message", () => {
    validInput.weaponsSeen = undefined

    const { errors } = check(validInput)
    expect(errors).toEqual([
      {
        href: '#weaponsSeen',
        text: 'Select yes if any weapons were observed',
      },
    ])
  })

  it('Not adding weapon types but selecting YES for weaponsSeen returns validation error messages', () => {
    validInput.weaponsSeen = 'YES'
    validInput.weaponTypes = undefined
    const { errors } = check(validInput)

    expect(errors).toEqual([{ href: '#weaponTypes[0]', text: 'Enter the type of weapon observed' }])
  })

  it('Should return validation error if  weaponTypes are duplicated', () => {
    validInput.weaponsSeen = 'YES'
    validInput.weaponTypes = [{ weaponType: 'knife' }, { weaponType: 'knife' }]
    const { errors } = check(validInput)

    expect(errors).toEqual([
      { href: '#weaponTypes[1]', text: "Weapon 'knife' has already been added - remove this weapon" },
    ])
  })

  it('Should not return validation error if all weapons are unique', () => {
    validInput.weaponsSeen = 'YES'
    validInput.weaponTypes = [{ weaponType: 'knife' }, { weaponType: 'bat' }]
    const { errors } = check(validInput)

    expect(errors).toEqual([])
  })

  it('Should trim empty-string weapon types', () => {
    validInput.weaponsSeen = 'YES'
    validInput.weaponTypes = [{ weaponType: '    AAA  ', age: '29' }, { weaponType: '' }, { weaponType: 'BBB' }]

    const { errors, formResponse } = check(validInput)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      batonDrawn: true,
      batonUsed: true,
      bodyWornCamera: 'NO',
      escortingHold: true,
      guidingHold: true,
      guidingHoldOfficersInvolved: 2,
      handcuffsApplied: true,
      painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
      pavaDrawn: true,
      pavaUsed: true,
      weaponsSeen: 'YES',
      weaponTypes: [
        {
          weaponType: 'AAA',
        },
        {
          weaponType: 'BBB',
        },
      ],
      personalProtectionTechniques: true,
      positiveCommunication: true,
      restraintPositions: ['STANDING', 'FACE_DOWN'],
    })
  })

  it('Weapon Types are removed when Weapons Seen is NO', () => {
    validInput.weaponsSeen = 'NO'
    validInput.weaponTypes = [{ weaponType: 'AAA' }, { weaponType: '' }, { weaponType: 'AAA' }]

    const { errors, formResponse } = check(validInput)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      batonDrawn: true,
      batonUsed: true,
      bodyWornCamera: 'NO',
      escortingHold: true,
      guidingHold: true,
      guidingHoldOfficersInvolved: 2,
      handcuffsApplied: true,
      painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
      pavaDrawn: true,
      pavaUsed: true,
      weaponsSeen: 'NO',
      personalProtectionTechniques: true,
      positiveCommunication: true,
      restraintPositions: ['STANDING', 'FACE_DOWN'],
    })
  })

  it('WeaponsSeen field must be one of allowed values', () => {
    validInput.weaponsSeen = 'SOMETHING_RANDOM'
    const { errors, formResponse } = check(validInput)

    expect(errors).toEqual([
      {
        href: '#weaponsSeen',
        text: 'Select yes if any weapons were observed',
      },
    ])

    expect(formResponse).toEqual({
      batonDrawn: true,
      batonUsed: true,
      bodyWornCamera: 'NO',
      escortingHold: true,
      guidingHold: true,
      guidingHoldOfficersInvolved: 2,
      handcuffsApplied: true,
      painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
      pavaDrawn: true,
      pavaUsed: true,
      weaponsSeen: 'SOMETHING_RANDOM',
      personalProtectionTechniques: true,
      positiveCommunication: true,
      restraintPositions: ['STANDING', 'FACE_DOWN'],
    })
  })
})
