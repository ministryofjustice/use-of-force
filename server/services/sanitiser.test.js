const R = require('ramda')
const joi = require('@hapi/joi')
const { trimmedString, toBoolean, toInteger, toSmallInt } = require('../config/forms/sanitisers')
const { simplifyDescription, buildSanitiser } = require('./sanitiser')
const { formConfig: evidenceFormConfig } = require('../config/forms/evidenceForm')
const { formConfig: incidentDetailsFormConfig } = require('../config/forms/incidentDetailsForm')
const { formConfig: relocationAndInjuriesFormConfig } = require('../config/forms/relocationAndInjuriesForm')
const statementFormConfig = require('../config/forms/statementForm')
const { formConfig: useOfForceDetailsFormConfig } = require('../config/forms/useOfForceDetailsForm')

describe('using meta to specify sanitisers', () => {
  it('allows a sanitiser to be attached as metadata', () => {
    expect(
      joi
        .string()
        .required()
        .meta({ sanitiser: trimmedString })
        .describe()
    ).toEqual({
      flags: {
        presence: 'required',
      },
      metas: [
        {
          sanitiser: trimmedString,
        },
      ],
      type: 'string',
    })
  })

  it('allows sanitisers to be attached as metadata to all validated types', () => {
    const schema = joi
      .object({
        a: joi.string().meta({ sanitiser: trimmedString }),
        b: joi.number().meta({ sanitiser: toInteger }),
        c: joi.boolean().meta({ sanitiser: toBoolean }),
        d: joi
          .array()
          .meta({ sanitiser: R.identity })
          .items(joi.string().meta({ sanitiser: trimmedString })),
        e: joi.valid(1, 'a').meta({ sanitiser: R.identity }),
        f: joi
          .when('c', {
            is: true,
            then: joi.array().items({
              fa: joi.string().meta({ sanitiser: trimmedString }),
            }),
            otherwise: joi.any().strip(),
          })
          .meta({ sanitiser: R.identity }),
      })
      .meta({ sanitiser: R.identity })

    expect(schema.describe()).toEqual({
      keys: {
        a: {
          metas: [{ sanitiser: trimmedString }],
          type: 'string',
        },
        b: {
          metas: [{ sanitiser: toInteger }],
          type: 'number',
        },
        c: {
          metas: [{ sanitiser: toBoolean }],
          type: 'boolean',
        },
        d: {
          items: [{ metas: [{ sanitiser: trimmedString }], type: 'string' }],
          metas: [{ sanitiser: R.identity }],
          type: 'array',
        },
        e: {
          allow: [1, 'a'],
          flags: {
            only: true,
          },
          metas: [{ sanitiser: R.identity }],
          type: 'any',
        },
        f: {
          metas: [
            {
              sanitiser: R.identity,
            },
          ],
          type: 'any',
          whens: [
            {
              is: {
                allow: [
                  {
                    override: true,
                  },
                  true,
                ],
                flags: {
                  only: true,
                  presence: 'required',
                },
                type: 'any',
              },
              otherwise: {
                flags: {
                  result: 'strip',
                },
                type: 'any',
              },
              ref: {
                path: ['c'],
              },
              then: {
                items: [
                  {
                    keys: {
                      fa: {
                        metas: [
                          {
                            sanitiser: trimmedString,
                          },
                        ],
                        type: 'string',
                      },
                    },
                    type: 'object',
                  },
                ],
                type: 'array',
              },
            },
          ],
        },
      },
      metas: [{ sanitiser: R.identity }],
      type: 'object',
    })
  })

  it('allows multiple sanitisers to be attached as metadata', () => {
    expect(
      joi
        .string()
        .required()
        .meta({ sanitiser: trimmedString })
        .meta({ sanitiser: toInteger })
        .describe()
    ).toEqual({
      flags: {
        presence: 'required',
      },
      metas: [{ sanitiser: trimmedString }, { sanitiser: toInteger }],
      type: 'string',
    })
  })
})

describe('simplifying descriptions', () => {
  it('simplifies a description of a primitive', () => {
    const schema = joi.string().meta({ sanitiser: trimmedString })

    expect(simplifyDescription(schema.describe())).toEqual({ type: 'primitive', sanitiser: trimmedString })
  })

  it('simplifies a description of an object', () => {
    const f = x => x

    const schema = joi.object({}).meta({ sanitiser: f })

    expect(simplifyDescription(schema.describe())).toEqual({ type: 'object', sanitiser: f, keys: {} })
  })

  it('simplifies a description of an object that has a key', () => {
    const f = x => x
    const g = x => x

    const schema = joi.object({ a: joi.string().meta({ sanitiser: g }) }).meta({ sanitiser: f })

    expect(simplifyDescription(schema.describe())).toEqual({
      type: 'object',
      sanitiser: f,
      keys: { a: { type: 'primitive', sanitiser: g } },
    })
  })

  it('simplifies a description of an array with no items', () => {
    const f = x => x
    const schema = joi.array().meta({ sanitiser: f })

    expect(simplifyDescription(schema.describe())).toEqual({
      type: 'array',
      sanitiser: f,
      items: [],
    })
  })

  it('simplifies a description of an array of items', () => {
    const f = x => x
    const g = x => x
    const schema = joi
      .array()
      .items(joi.any().meta({ sanitiser: g }))
      .meta({ sanitiser: f })

    expect(simplifyDescription(schema.describe())).toEqual({
      type: 'array',
      sanitiser: f,
      items: [{ type: 'primitive', sanitiser: g }],
    })
  })

  it('simplifes a description with no sanitisers. (All sanitisers are R.identity)', () => {
    const schema = joi
      .object({
        a: joi.string().required(),
        b: joi
          .array()
          .items(
            joi
              .object({
                p: joi.number().required(),
                q: joi.boolean().required(),
              })
              .min(1)
              .max(2)
              .required()
          )
          .required(),
      })
      .required()

    expect(simplifyDescription(schema.describe())).toEqual({
      keys: {
        a: {
          sanitiser: R.identity,
          type: 'primitive',
        },
        b: {
          items: [
            {
              keys: {
                p: {
                  sanitiser: R.identity,
                  type: 'primitive',
                },
                q: {
                  sanitiser: R.identity,
                  type: 'primitive',
                },
              },
              sanitiser: R.identity,
              type: 'object',
            },
          ],
          sanitiser: R.identity,
          type: 'array',
        },
      },
      sanitiser: R.identity,
      type: 'object',
    })
  })

  it('simplifies a description of a "when"', () => {
    const f = x => x
    const g = x => x
    const h = x => x
    const i = x => x

    const schema = joi
      .object({
        a: joi.boolean(),
        b: joi
          .when('a', {
            is: true,
            then: joi
              .array()
              .items(joi.object({ p: joi.string().meta({ sanitiser: h }) }))
              .meta({ sanitiser: g }),
            otherwise: joi.any().strip(),
          })
          .meta({ sanitiser: i }),
      })
      .meta({ sanitiser: f })

    expect(simplifyDescription(schema.describe())).toEqual({
      keys: {
        a: {
          type: 'primitive',
          sanitiser: R.identity,
        },
        // Substitute the 'when' branch for content...
        b: {
          items: [
            {
              keys: {
                p: {
                  sanitiser: h,
                  type: 'primitive',
                },
              },
              sanitiser: R.identity,
              type: 'object',
            },
          ],
          sanitiser: g,
          type: 'array',
        },
      },
      sanitiser: f,
      type: 'object',
    })
  })
})

describe('building sanitisers', () => {
  const getSanitiser = schema => buildSanitiser(schema.describe())

  const doublerSanitiser = { sanitiser: x => (R.isNil(x) ? x : x + x) }

  describe('a sanitiser for a string (primitive)', () => {
    const sanitiser = getSanitiser(joi.string().meta(doublerSanitiser))

    it('sanitises a string', () => expect(sanitiser('a')).toEqual('aa'))
    it('sanitises empty string', () => expect(sanitiser('')).toEqual(''))
    it('sanitises null', () => expect(sanitiser(null)).toEqual(null))
    it('sanitises undefined', () => expect(sanitiser(undefined)).toEqual(undefined))
  })

  const addTestFieldSanitiser = { sanitiser: R.assoc('test', 'test') }

  it('sanitises an object that has no properties', () => {
    const sanitiser = getSanitiser(joi.object().meta(addTestFieldSanitiser))
    expect(sanitiser({})).toEqual({ test: 'test' })
  })

  describe('an object sanitiser', () => {
    const sanitiser = getSanitiser(joi.object({ a: joi.string().meta(doublerSanitiser) }).meta(addTestFieldSanitiser))

    it('sanitises an  object that has a string property', () =>
      expect(sanitiser({ a: 'a' })).toEqual({ test: 'test', a: 'aa' }))

    it('sanitises an empty object', () => expect(sanitiser({})).toEqual({ test: 'test' }))
    it('sanitises an absent object', () => expect(sanitiser(null)).toEqual(null))
    it('sanitises an undefined object', () => expect(sanitiser(undefined)).toEqual(undefined))
    it('drops properties not mentioned in schema', () =>
      expect(sanitiser({ b: 1, a: '' })).toEqual({ test: 'test', a: '' }))
  })

  const addTestItemSanitiser = { sanitiser: R.append('test') }

  describe('an array sanitiser', () => {
    const sanitiser = getSanitiser(
      joi
        .array()
        .items(joi.string().meta(doublerSanitiser))
        .meta(addTestItemSanitiser)
    )

    it('sanitises an empty array', () => expect(sanitiser([])).toEqual(['test']))
    it('sanitises a single item array', () => expect(sanitiser(['a'])).toEqual(['aa', 'test']))
    it('sanitises a 3 item array', () => expect(sanitiser(['a', '', null])).toEqual(['aa', '', null, 'test']))
    it('sanitises an absent array', () => expect(sanitiser(null)).toEqual(null))
  })

  const booleanToggleSanitiser = { sanitiser: x => (R.isNil(x) ? x : !x) }

  describe('sanitiser for composites', () => {
    const sanitiser = getSanitiser(
      joi
        .object({
          a: joi
            .string()
            .required()
            .meta(doublerSanitiser),
          b: joi
            .array()
            .items(
              joi
                .object({
                  p: joi
                    .number()
                    .required()
                    .meta(doublerSanitiser),
                  q: joi
                    .boolean()
                    .required()
                    .meta(booleanToggleSanitiser),
                })
                .min(1)
                .max(2)
                .required()
                .meta(addTestFieldSanitiser)
            )
            .required()
            .meta(addTestItemSanitiser),
        })
        .required()
        .meta(addTestFieldSanitiser)
    )

    it('sanitises absent object', () => expect(sanitiser(undefined)).toBeUndefined())
    it('sanitises object with "a"', () => expect(sanitiser({ a: 'A' })).toEqual({ a: 'AA', test: 'test' }))
    it('sanitises object with empty "b"', () => expect(sanitiser({ b: [] })).toEqual({ b: ['test'], test: 'test' }))

    it('sanitises object with a single "b" item that is empty', () =>
      expect(sanitiser({ b: [{}] })).toEqual({
        b: [{ test: 'test' }, 'test'],
        test: 'test',
      }))

    it('sanitises object with a single "b" item', () =>
      expect(sanitiser({ b: [{ p: 1, q: false }] })).toEqual({
        b: [{ test: 'test', p: 2, q: true }, 'test'],
        test: 'test',
      }))

    it('sanitises populated composite', () =>
      expect(
        sanitiser({ a: 'A', b: [{ p: 1, q: false }, { p: 2 }, { q: true }, { ignore: 1 }], ignore: [{}] })
      ).toEqual({
        a: 'AA',
        b: [
          { test: 'test', p: 2, q: true },
          { p: 4, test: 'test' },
          { q: false, test: 'test' },
          { test: 'test' },
          'test',
        ],
        test: 'test',
      }))
  })

  describe('sanitising a composite with no sanitisers specified, should just clone value', () => {
    const sanitiser = getSanitiser(
      joi
        .object({
          a: joi.string().required(),
          b: joi
            .array()
            .items(
              joi
                .object({
                  p: joi.number().required(),
                  q: joi.boolean().required(),
                })
                .min(1)
                .max(2)
                .required()
            )
            .required(),
        })
        .required()
    )

    it('sanitises absent object', () => expect(sanitiser(undefined)).toBeUndefined())
    it('sanitises object with "a"', () => expect(sanitiser({ a: 'A' })).toEqual({ a: 'A' }))
    it('sanitises object with empty "b"', () => expect(sanitiser({ b: [] })).toEqual({ b: [] }))
    it('sanitises object with a single "b" item that is empty', () =>
      expect(sanitiser({ b: [{}] })).toEqual({ b: [{}] }))

    it('sanitises object with a single "b" item', () =>
      expect(sanitiser({ b: [{ p: 1, q: false }] })).toEqual({ b: [{ p: 1, q: false }] }))

    it('sanitises populated composite', () =>
      expect(
        sanitiser({
          a: 'A',
          b: [{ p: 1, q: false }, { p: 2 }, { q: true }, { ignore: 1 }],
          ignore: [{}],
        })
      ).toEqual({
        a: 'A',
        b: [{ p: 1, q: false }, { p: 2 }, { q: true }, {}],
      }))
  })

  describe('builds sanitisers for all the schemas in server/config/forms', () => {
    it('builds sanitiser for evidence form', () => {
      getSanitiser(evidenceFormConfig.schemas.complete)
    })

    it('builds sanitiser for incident details form', () => {
      getSanitiser(incidentDetailsFormConfig.schemas.complete)
    })

    it('builds sanitiser for relocation and injuries form', () => {
      getSanitiser(relocationAndInjuriesFormConfig.schemas.complete)
    })

    it('builds sanitiser for statement form', () => {
      getSanitiser(statementFormConfig.schemas.complete)
    })

    it('builds sanitiser for use of force details form', () => {
      getSanitiser(useOfForceDetailsFormConfig.schemas.complete)
    })
  })
})

describe('folding sanitisers', () => {
  const sanitisers = [trimmedString, toInteger, toSmallInt]
  const composedSanitisers = R.reduce(R.pipe)(R.identity)(sanitisers)

  it('sanitises "  "', () => expect(composedSanitisers('  ')).toEqual(null))
  it('sanitises " 1 "', () => expect(composedSanitisers(' 1 ')).toEqual(1))
  it('sanitises "99999"', () => expect(composedSanitisers('99999')).toEqual(null))
  it('sanitises "  32767 "', () => expect(composedSanitisers('  \t32767\n')).toEqual(32767))
  it('sanitises "  -32768 "', () => expect(composedSanitisers('  \t-32768\n')).toEqual(-32768))
})
