const joi = require('@hapi/joi')

const { extractFirstFieldNameMap, buildErrorDetailAdapter } = require('./errorDetailAdapter')

const sanitiser = x => x

const ffn = name => ({ sanitiser, firstFieldName: name, fieldType: 'XXXXX' })

describe('errorDetailAdapter', () => {
  const schema = joi
    .object({
      a: joi.string().meta(ffn('aFn')),
      b: joi.number().meta({ sanitiser }),
      c: joi
        .boolean()
        .meta({ sanitiser: x => x })
        .meta(ffn('cFn')),
      d: joi
        .array()
        .meta({ sanitiser })
        .items(joi.string().meta({ sanitiser })),
      e: joi
        .valid(1, 'a')
        .meta({ sanitiser })
        .meta(ffn('eFn')),
      f: joi
        .when('c', {
          is: true,
          then: joi.array().items({
            fa: joi.string().meta({ sanitiser }),
          }),
          otherwise: joi.any().strip(),
        })
        .meta({ sanitiser })
        .meta(ffn('fFn')),
    })
    .meta({ sanitiser })

  it('extracts firstFieldName map from a schema description', () => {
    expect(extractFirstFieldNameMap(schema.describe())).toEqual({
      a: 'aFn',
      c: 'cFn',
      e: 'eFn',
      f: 'fFn',
    })
  })

  it('builds an error detail adapter', () => {
    buildErrorDetailAdapter(schema.describe())
  })

  it('adapts an error for an unannotated field', () => {
    const adaptErrorDetail = buildErrorDetailAdapter(schema.describe())

    expect(adaptErrorDetail({ path: ['b'], message: 'error' })).toEqual({ href: '#b', text: 'error' })
  })

  it('adapts an error for an annotated field', () => {
    const adaptErrorDetail = buildErrorDetailAdapter(schema.describe())

    expect(adaptErrorDetail({ path: ['f'], message: 'error' })).toEqual({ href: '#fFn', text: 'error' })
  })

  it('adapts an error for an annotated field, when the oath has more than one element', () => {
    const adaptErrorDetail = buildErrorDetailAdapter(schema.describe())

    expect(adaptErrorDetail({ path: ['f', '2'], message: 'error' })).toEqual({ href: '#f[2]', text: 'error' })
  })
})
