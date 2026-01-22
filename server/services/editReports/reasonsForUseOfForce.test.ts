import reasonsForUseOfForce from './reasonsForUseOfForce'

describe('reasonsForUseOfForce', () => {
  const baseReport = {
    form: {
      reasonsForUseOfForce: {
        reasons: ['FIGHT_BETWEEN_PRISONERS'],
      },
    },
  }

  it('should return no changes when values match', () => {
    const valuesFromRequestBody = {
      reasons: ['FIGHT_BETWEEN_PRISONERS'],
      primaryReason: undefined,
    }

    expect(reasonsForUseOfForce(baseReport, valuesFromRequestBody)).toEqual({
      reasons: {
        question: 'Why was use of force applied against this prisoner?',
        oldValue: ['FIGHT_BETWEEN_PRISONERS'],
        newValue: ['FIGHT_BETWEEN_PRISONERS'],
        hasChanged: false,
      },
      primaryReason: {
        question: 'What was the primary reason use of force was applied against this prisoner?',
        oldValue: undefined,
        newValue: undefined,
        hasChanged: false,
      },
    })
  })

  it('should detect change in reasons', () => {
    const valuesFromRequestBody = {
      reasons: ['FIGHT_BETWEEN_PRISONERS', 'TO_PREVENT_ESCAPE_OR_ABSCONDING'],
      primaryReason: undefined,
    }

    expect(reasonsForUseOfForce(baseReport, valuesFromRequestBody)).toEqual({
      reasons: {
        question: 'Why was use of force applied against this prisoner?',
        oldValue: ['FIGHT_BETWEEN_PRISONERS'],
        newValue: ['FIGHT_BETWEEN_PRISONERS', 'TO_PREVENT_ESCAPE_OR_ABSCONDING'],
        hasChanged: true,
      },
      primaryReason: {
        question: 'What was the primary reason use of force was applied against this prisoner?',
        oldValue: undefined,
        newValue: undefined,
        hasChanged: false,
      },
    })
  })

  it('should detect change in primaryReason', () => {
    const valuesFromRequestBody = {
      reasons: ['FIGHT_BETWEEN_PRISONERS', 'TO_PREVENT_ESCAPE_OR_ABSCONDING'],
      primaryReason: 'TO_PREVENT_ESCAPE_OR_ABSCONDING',
    }

    expect(reasonsForUseOfForce(baseReport, valuesFromRequestBody)).toEqual({
      reasons: {
        question: 'Why was use of force applied against this prisoner?',
        oldValue: ['FIGHT_BETWEEN_PRISONERS'],
        newValue: ['FIGHT_BETWEEN_PRISONERS', 'TO_PREVENT_ESCAPE_OR_ABSCONDING'],
        hasChanged: true,
      },
      primaryReason: {
        question: 'What was the primary reason use of force was applied against this prisoner?',
        oldValue: undefined,
        newValue: 'TO_PREVENT_ESCAPE_OR_ABSCONDING',
        hasChanged: true,
      },
    })
  })

  it('should handle missing reasonsForUseOfForce in report', () => {
    const reportWithoutReasons = { form: {} }

    const valuesFromRequestBody = {
      reasons: ['TO_PREVENT_ESCAPE_OR_ABSCONDING'],
      primaryReason: undefined,
    }

    expect(reasonsForUseOfForce(reportWithoutReasons, valuesFromRequestBody)).toEqual({
      reasons: {
        question: 'Why was use of force applied against this prisoner?',
        oldValue: undefined,
        newValue: ['TO_PREVENT_ESCAPE_OR_ABSCONDING'],
        hasChanged: true,
      },
      primaryReason: {
        question: 'What was the primary reason use of force was applied against this prisoner?',
        oldValue: undefined,
        newValue: undefined,
        hasChanged: false,
      },
    })
  })
})
