const R = require('ramda')
const { validate } = require('../../utils/fieldValidation')
const {
  joi,
  caseInsensitiveComparator,
  validations: {
    requiredMonthIndexNotInFuture,
    requiredYearNotInFuture,
    requiredBooleanMsg,
    requiredOneOfMsg,
    requiredIntegerMsg,
    requiredStringMsg,
    requiredPatternMsg,
  },
} = require('./validations')

jest.mock('moment', () => () => ({
  year: () => 2019,
  month: () => 9,
}))

describe('requiredMonthIndexNotInFuture', () => {
  const formSchema = joi.object({
    year: requiredYearNotInFuture.messages({
      'number.max': '"{#label}" must be less than or equal to {$year}',
      'number.ref': 'ref',
    }),
    month: requiredMonthIndexNotInFuture('year'),
  })

  const fields = [
    {
      month: {
        validationMessage: 'Select the month',
      },
    },
    {
      year: {},
    },
  ]

  const selectMonth = {
    href: '#month',
    text: 'Select the month',
  }

  const yearLessEq2019 = {
    href: '#year',
    text: '"year" must be less than or equal to 2019',
  }

  const yearMustBeANumber = {
    href: '#year',
    text: '"year" must be a number',
  }

  const yearIsRequired = {
    href: '#year',
    text: '"year" is required',
  }

  const extract = validationResult => (validationResult.error ? validationResult.error.details : [])

  test('This month of this year valid', () => {
    expect(extract(validate(fields, formSchema, { month: '9', year: '2019' }))).toEqual([])
  })

  test('Next month of this year invalid', () => {
    expect(extract(validate(fields, formSchema, { month: '10', year: '2019' }))).toEqual([selectMonth])
  })

  test('Next year invalid', () => {
    expect(extract(validate(fields, formSchema, { month: '01', year: '2020' }))).toEqual([yearLessEq2019])
  })

  test('Last month of previous year valid', () => {
    expect(extract(validate(fields, formSchema, { month: '11', year: '2018' }))).toEqual([])
  })

  test('year is not a number', () => {
    expect(extract(validate(fields, formSchema, { month: '1', year: 'xxxx' }))).toEqual([yearMustBeANumber])
  })

  test('no month or year', () => {
    expect(extract(validate(fields, formSchema, {}))).toEqual(expect.arrayContaining([yearIsRequired]))
  })
})

const buildValidator = schema => value =>
  schema.validate(value, {
    abortEarly: false,
    convert: true,
    allowUnknown: false,
    stripUnknown: true,
  })

describe('requiredBoolean', () => {
  const rbv = buildValidator(requiredBooleanMsg('Required'))

  it('true', () => {
    expect(rbv('true')).toEqual({ value: true })
  })

  it('false', () => {
    expect(rbv('false')).toEqual({ value: false })
  })

  it('xxx', () => {
    const {
      value,
      error: { details },
    } = rbv('xxx')

    expect(value).toEqual('xxx')

    expect(details).toEqual([
      {
        context: {
          label: 'value',
          value: 'xxx',
        },
        message: 'Required',
        path: [],
        type: 'boolean.base',
      },
    ])
  })

  it('undefined', () => {
    const {
      value,
      error: { details },
    } = rbv(undefined)

    expect(value).toBeUndefined()

    expect(details).toEqual([
      {
        context: {
          label: 'value',
        },
        message: 'Required',
        path: [],
        type: 'any.required',
      },
    ])
  })

  describe('accepts bespoke error messages', () => {
    const rbvm = buildValidator(requiredBooleanMsg('Please supply a value for "{#label}"').label('Thing'))

    it('uses bespoke errorMessage', () => {
      expect(rbvm('xxx').error.details[0].message).toEqual('Please supply a value for "Thing"')
    })

    it('uses bespoke errorMessage', () => {
      expect(rbvm(undefined).error.details[0].message).toEqual('Please supply a value for "Thing"')
    })
  })

  describe('can set bespoke error messages', () => {
    const rbvm = buildValidator(
      joi
        .string()
        .$.min(2)
        .max(3)
        .message('Wrong size')
        .required()
        .messages({
          'string.base': 'Yo, duuude! The "{#label}" gotta be a string',
          'string.empty': 'Please supply a string',
          'any.required': 'The "{#label}" is required',
        })
        .label('Thing')
    )

    it('uses single message for a string that is too short', () => {
      expect(rbvm('1').error.details[0].message).toEqual('Wrong size')
    })

    it('...or too long', () => {
      expect(rbvm('1234').error.details[0].message).toEqual('Wrong size')
    })

    it('uses a different message for an empty string', () => {
      expect(rbvm('').error.details[0].message).toEqual('Please supply a string')
    })

    it('uses a different message for an absent string', () => {
      expect(rbvm(undefined).error.details[0].message).toEqual('The "Thing" is required')
    })
    it('uses a different message for a type mismatch', () => {
      expect(rbvm(true).error.details[0].message).toEqual('Yo, duuude! The "Thing" gotta be a string')
    })
  })
})

describe('requiredOneOf', () => {
  const errorMessage = 'Gotta be A, B, or C'
  const rovm = buildValidator(requiredOneOfMsg('A', 'B', 'C')(errorMessage))

  it('should accept required values A', () => {
    expect(rovm('A').errror).toBeUndefined()
  })

  it('should accept required values B', () => {
    expect(rovm('B').errror).toBeUndefined()
  })

  it('should accept required values C', () => {
    expect(rovm('C').errror).toBeUndefined()
  })

  it('should reject other values D', () => {
    expect(rovm('D').error.details[0].message).toEqual(errorMessage)
  })

  it('should reject empty value', () => {
    expect(rovm('').error.details[0].message).toEqual(errorMessage)
  })

  it('should reject missing value', () => {
    expect(rovm(undefined).error.details[0].message).toEqual(errorMessage)
  })
})

describe('requiredIntegerMsg', () => {
  const rivm = buildValidator(requiredIntegerMsg('That is not an integer'))

  it('valid integer', () => {
    expect(rivm('1').error).toBeUndefined()
  })

  it('not an integer', () => {
    expect(rivm('1.1').error.details).toEqual([
      {
        context: {
          label: 'value',
          value: 1.1,
        },
        message: 'That is not an integer',
        path: [],
        type: 'number.integer',
      },
    ])
  })

  it('not a number', () => {
    expect(rivm('abc').error.details[0].message).toEqual('That is not an integer')
  })

  it('empty', () => {
    expect(rivm('').error.details[0].message).toEqual('That is not an integer')
  })

  it('missing', () => {
    expect(rivm(undefined).error.details[0].message).toEqual('That is not an integer')
  })
})

describe('Extending requiredStringMsg', () => {
  const v = buildValidator(
    requiredStringMsg('It is required')
      .pattern(/^abc$/)
      .message('must be "abc"')
  )

  it('should be possible to add a pattern to requiredStringMsg', () => {
    expect(v('abc').error).toBeUndefined()
  })

  it('should reject incorrect string value', () => {
    expect(v('abd').error.details[0].message).toEqual('must be "abc"')
  })

  it('should still use message from requiredStringMessage', () => {
    expect(v(undefined).error.details[0].message).toEqual('It is required')
  })
})

describe('requiredPatternMsg', () => {
  const message = 'It is required'
  const v = buildValidator(requiredPatternMsg(/^abc$/)(message))

  it('passes pattern match', () => {
    expect(v('abc').error).toBeUndefined()
  })

  it('should reject incorrect string value', () => {
    expect(v('abd').error.details[0].message).toEqual(message)
  })

  it('should still use message from requiredStringMessage', () => {
    expect(v(undefined).error.details[0].message).toEqual(message)
  })
})

describe('caseInsensitiveComparator', () => {
  const compare = caseInsensitiveComparator('a')

  it('should provide case-insensitive comparison', () => {
    expect(compare({ a: 'A' }, { a: 'a' })).toEqual(true)
    expect(compare({ a: 'A' }, { a: 'B' })).toEqual(false)
    expect(compare({ a: 'A' }, {})).toEqual(false)
  })
})
