import EditUseOfForceDetailsService from './editUseOfForceDetailsService'

const ControlAndRestraintPosition = {
  STANDING: {
    value: 'STANDING',
    label: 'Standing',
    sub_options_label: 'Standing techniques (optional)',
    sub_options: true,
  },
  STANDING__WRIST_WEAVE: { value: 'STANDING__WRIST_WEAVE', label: 'Wrist weave', parent: 'STANDING' },
  STANDING__DOUBLE_WRIST_HOLD: { value: 'STANDING__DOUBLE_WRIST_HOLD', label: 'Double wrist hold', parent: 'STANDING' },
  STANDING__UNDERHOOK: { value: 'STANDING__UNDERHOOK', label: 'Underhook', parent: 'STANDING' },
  STANDING__WRIST_HOLD: { value: 'STANDING__WRIST_HOLD', label: 'Wrist hold', parent: 'STANDING' },
  STANDING__STRAIGHT_ARM_HOLD: { value: 'STANDING__STRAIGHT_ARM_HOLD', label: 'Straight arm hold', parent: 'STANDING' },
  ON_BACK: {
    value: 'ON_BACK',
    label: 'On back (supine)',
    sub_options_label: 'On back techniques (optional)',
    sub_options: true,
  },
  ON_BACK__STRAIGHT_ARM_HOLD: {
    value: 'ON_BACK__STRAIGHT_ARM_HOLD',
    label: 'Straight arm hold (left or right)',
    parent: 'ON_BACK',
  },
  ON_BACK__CONVERSION_TO_RBH: {
    value: 'ON_BACK__CONVERSION_TO_RBH',
    label: 'Conversion to apply rigid bar handcuffs',
    parent: 'ON_BACK',
  },
  ON_BACK__WRIST_HOLD: { value: 'ON_BACK__WRIST_HOLD', label: 'Wrist hold', parent: 'ON_BACK' },
  FACE_DOWN: {
    value: 'FACE_DOWN',
    label: 'On front (prone)',
    sub_options_label: 'On front techniques (optional)',
    sub_options: true,
  },
  FACE_DOWN__BALANCE_DISPLACEMENT: {
    value: 'FACE_DOWN__BALANCE_DISPLACEMENT',
    label: 'Balance displacement technique',
    parent: 'FACE_DOWN',
  },
  FACE_DOWN__STRAIGHT_ARM_HOLD: {
    value: 'FACE_DOWN__STRAIGHT_ARM_HOLD',
    label: 'Straight arm hold (left or right)',
    parent: 'FACE_DOWN',
  },
  FACE_DOWN__CONVERSION_TO_RBH: {
    value: 'FACE_DOWN__CONVERSION_TO_RBH',
    label: 'Conversion to apply rigid bar handcuffs',
    parent: 'FACE_DOWN',
  },
  FACE_DOWN__WRIST_HOLD: { value: 'FACE_DOWN__WRIST_HOLD', label: 'Wrist hold', parent: 'FACE_DOWN' },
  KNEELING: { value: 'KNEELING', label: 'Kneeling', sub_options: false },
  NONE: { value: 'NONE', label: 'No control and restraint positions were used', exclusive: true, sub_options: false },
}

const PainInducingTechniquesUsed = {
  FINAL_LOCK_FLEXION: { value: 'FINAL_LOCK_FLEXION', label: 'Wrist flexion' },
  FINAL_LOCK_ROTATION: { value: 'FINAL_LOCK_ROTATION', label: 'Wrist rotation' },
  THUMB_LOCK: { value: 'THUMB_LOCK', label: 'Thumb lock' },
  NONE: { value: 'NONE', label: 'No pain inducing techniques were used', exclusive: true },
}

const UofReasons = {
  ASSAULT_ON_A_MEMBER_OF_STAFF: { value: 'ASSAULT_ON_A_MEMBER_OF_STAFF', label: 'Assault on a member of staff' },
  TO_PREVENT_ESCAPE_OR_ABSCONDING: {
    value: 'TO_PREVENT_ESCAPE_OR_ABSCONDING',
    label: 'To prevent escape or absconding',
  },
  SELF_HARM: { value: 'SELF_HARM', label: 'Self-harm' },
}
describe('EditUseOfForceDetailsService', () => {
  let service

  beforeEach(() => {
    service = new EditUseOfForceDetailsService()
  })

  describe('toYesNoNone', () => {
    test.each([
      [true, 'Yes'],
      [false, 'No'],
      ['YES', 'Yes'],
      ['NO', 'No'],
      [null, ''],
      ['maybe', ''],
    ])('returns correct output for %p', (input, expected) => {
      expect(service.toYesNoNone(input)).toBe(expected)
    })
  })

  describe('formatObjectArrayToString', () => {
    it('joins object values correctly', () => {
      const arr = [{ cameraNum: '123' }, { cameraNum: '456' }]
      expect(service.formatObjectArrayToString(arr, 'cameraNum')).toBe('123, 456')
    })

    it('returns empty string for null/undefined', () => {
      expect(service.formatObjectArrayToString(null, 'cameraNum')).toBe('')
      expect(service.formatObjectArrayToString(undefined, 'cameraNum')).toBe('')
    })
  })

  describe('formatDisplayOfRestraintAndPainInducingQuestions', () => {
    describe('with ControlAndRestraintPosition', () => {
      const noneMessage = 'No positions'

      it('returns empty string if falsy input', () => {
        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions(undefined, ControlAndRestraintPosition, noneMessage)
        ).toBe('')
        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions(null, ControlAndRestraintPosition, noneMessage)
        ).toBe('')
        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions('', ControlAndRestraintPosition, noneMessage)
        ).toBe('')
      })

      it('returns none message for NONE input', () => {
        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions('NONE', ControlAndRestraintPosition, noneMessage)
        ).toBe('No positions')
      })

      it('returns label for single parent value', () => {
        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions('STANDING', ControlAndRestraintPosition, noneMessage)
        ).toBe('Standing')
      })
      it('returns label for single different parent value', () => {
        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions('KNEELING', ControlAndRestraintPosition, noneMessage)
        ).toBe('Kneeling')
      })

      it('returns labels for multiple parents but none have child values', () => {
        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions(
            ['STANDING', 'ON_BACK'],
            ControlAndRestraintPosition,
            noneMessage
          )
        ).toBe('Standing, On back (supine)')
      })

      it('returns formatted string for parent with children', () => {
        const input = ['STANDING', 'STANDING__WRIST_WEAVE', 'STANDING__DOUBLE_WRIST_HOLD']
        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions(input, ControlAndRestraintPosition, noneMessage)
        ).toBe('Standing: Wrist weave, Double wrist hold')
      })

      it('returns formatted string for multiple parent/child groups', () => {
        const input = [
          'STANDING',
          'STANDING__WRIST_WEAVE',
          'ON_BACK',
          'ON_BACK__STRAIGHT_ARM_HOLD',
          'ON_BACK__CONVERSION_TO_RBH',
          'FACE_DOWN',
          'FACE_DOWN__BALANCE_DISPLACEMENT',
          'FACE_DOWN__STRAIGHT_ARM_HOLD',
          'FACE_DOWN__CONVERSION_TO_RBH',
          'KNEELING',
        ]

        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions(input, ControlAndRestraintPosition, noneMessage)
        ).toBe(
          'Standing: Wrist weave, On back (supine): Straight arm hold (left or right), Conversion to apply rigid bar handcuffs, On front (prone): Balance displacement technique, Straight arm hold (left or right), Conversion to apply rigid bar handcuffs, Kneeling'
        )
      })

      it('returns formatted string when some parents have no children', () => {
        const input = [
          'STANDING',
          'ON_BACK',
          'FACE_DOWN',
          'FACE_DOWN__BALANCE_DISPLACEMENT',
          'FACE_DOWN__STRAIGHT_ARM_HOLD',
          'FACE_DOWN__CONVERSION_TO_RBH',
          'KNEELING',
        ]

        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions(input, ControlAndRestraintPosition, noneMessage)
        ).toBe(
          'Standing, On back (supine), On front (prone): Balance displacement technique, Straight arm hold (left or right), Conversion to apply rigid bar handcuffs, Kneeling'
        )
      })
    })

    describe('with PainInducingTechniquesUsed', () => {
      const noneMessage = 'No pain inducing techniques were used'

      it('returns none message for NONE input', () => {
        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions('NONE', PainInducingTechniquesUsed, noneMessage)
        ).toBe('No pain inducing techniques were used')
      })

      it('returns label for single technique', () => {
        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions(
            'THUMB_LOCK',
            PainInducingTechniquesUsed,
            noneMessage
          )
        ).toBe('Thumb lock')
      })

      it('returns comma-separated list for multiple techniques', () => {
        const input = ['FINAL_LOCK_FLEXION', 'FINAL_LOCK_ROTATION']
        expect(
          service.formatDisplayOfRestraintAndPainInducingQuestions(input, PainInducingTechniquesUsed, noneMessage)
        ).toBe('Wrist flexion, Wrist rotation')
      })
    })
  })

  describe('formatDisplayOfReasonsQuestion', () => {
    it('joins reason labels', () => {
      const res = service.formatDisplayOfReasonsQuestion(['ASSAULT_ON_A_MEMBER_OF_STAFF', 'SELF_HARM'], UofReasons)
      expect(res).toBe('Assault on a member of staff, Self-harm')
    })

    it('returns empty string for no input', () => {
      expect(service.formatDisplayOfReasonsQuestion(null, UofReasons)).toBe('')
    })
  })

  describe('formatDisplayOfPrimaryReasonQuestion', () => {
    it('returns label for valid key', () => {
      const res = service.formatDisplayOfPrimaryReasonQuestion('TO_PREVENT_ESCAPE_OR_ABSCONDING', UofReasons)
      expect(res).toBe('To prevent escape or absconding')
    })

    it('returns empty string for falsy or invalid', () => {
      expect(service.formatDisplayOfPrimaryReasonQuestion(null, UofReasons)).toBe('')
      expect(service.formatDisplayOfPrimaryReasonQuestion('undefined', UofReasons)).toBe('')
      expect(service.formatDisplayOfPrimaryReasonQuestion('INVALID', UofReasons)).toBe('')
    })
  })

  describe('buildDetails', () => {
    it('formats boolean values as Yes/No', async () => {
      const questionSet = { wasCompliant: 'Was the person compliant?' }
      const changes = { wasCompliant: { oldValue: true, newValue: false } }

      const result = await service.buildDetails(questionSet, changes)
      expect(result).toEqual([{ question: 'Was the person compliant?', oldValue: 'Yes', newValue: 'No' }])
    })

    it('formats restraintPositions correctly', async () => {
      const questionSet = { restraintPositions: 'Restraint positions?' }
      const changes = {
        restraintPositions: {
          oldValue: ['STANDING', 'STANDING__WRIST_WEAVE'],
          newValue: ['KNEELING'],
        },
      }

      const result = await service.buildDetails(questionSet, changes)
      expect(result[0].oldValue).toBe('Standing: Wrist weave')
      expect(result[0].newValue).toBe('Kneeling')
    })

    it('formats painInducingTechniquesUsed correctly', async () => {
      const questionSet = { painInducingTechniquesUsed: 'Pain techniques used?' }
      const changes = {
        painInducingTechniquesUsed: {
          oldValue: 'NONE',
          newValue: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],
        },
      }

      const result = await service.buildDetails(questionSet, changes)
      expect(result[0].oldValue).toBe('No pain inducing techniques were used')
      expect(result[0].newValue).toBe('Wrist flexion, Thumb lock')
    })

    it('formats reasons and primaryReason correctly', async () => {
      const questionSet = {
        reasons: 'Reasons?',
        primaryReason: 'Primary reason?',
      }
      const changes = {
        reasons: {
          oldValue: ['ASSAULT_ON_A_MEMBER_OF_STAFF'],
          newValue: ['SELF_HARM'],
        },
        primaryReason: {
          oldValue: 'ASSAULT_ON_A_MEMBER_OF_STAFF',
          newValue: 'TO_PREVENT_ESCAPE_OR_ABSCONDING',
        },
      }

      const result = await service.buildDetails(questionSet, changes)

      expect(result.find(r => r.question === 'Reasons?').newValue).toBe('Self-harm')
      expect(result.find(r => r.question === 'Primary reason?').newValue).toBe('To prevent escape or absconding')
    })
  })
})
