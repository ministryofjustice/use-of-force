/* eslint-disable @typescript-eslint/no-require-imports */
import buildFieldTypeSplitter from './fieldTypeSplitter'

const joi = require('@hapi/joi')

const buildSplitter = schema => buildFieldTypeSplitter(schema.describe(), 'X')

describe('fieldTypeSplitter', () => {
  it('accepts empty Object schema', () => {
    buildSplitter(joi.object())
  })

  it('rejects other kinds of schema', () => {
    expect(() => buildSplitter(joi.any())).toThrow(Error)
  })

  it('partitions all keys to payloadFields by default', () => {
    const splitter = buildSplitter(joi.object({ a: joi.any() }))
    expect(splitter({ a: 'x', b: 'y' })).toEqual({
      payloadFields: { a: 'x', b: 'y' },
      extractedFields: {},
    })
  })

  it('partitions by fieldType', () => {
    const schema = joi.object({
      a: joi.any(),
      b: joi.any().meta({ fieldType: 'X' }),
    })

    const splitter = buildSplitter(schema)

    expect(splitter({ a: 'x', b: 'y' })).toEqual({
      payloadFields: { a: 'x' },
      extractedFields: { b: 'y' },
    })
  })

  it('merges data from multiple meta-data objects', () => {
    const schema = joi.object({
      a: joi.any(),
      b: joi.any().meta({ fieldType: 'Y' }).meta({ fieldType: 'X' }),
    })

    const splitter = buildSplitter(schema)

    expect(splitter({ a: 'x', b: 'y' })).toEqual({
      payloadFields: { a: 'x' },
      extractedFields: { b: 'y' },
    })
  })
})
