import express from 'express'
import { SectionStatus } from '../services/drafts/reportStatusChecker'
import nunjucksSetup from './nunjucksSetup'

describe('nunjucksSetup', () => {
  const app = express()
  const njk = nunjucksSetup(app)

  it('toChecked', () => {
    const model = [
      { desc: 'car', code: 'CAR' },
      { desc: 'bus', code: 'BUS' },
      { desc: 'boat', code: 'BOAT' },
    ]

    const result = njk.getFilter('toChecked')(model, 'code', 'desc', ['CAR', 'BOAT'])

    expect(result).toEqual([
      {
        checked: true,
        text: 'car',
        value: 'CAR',
      },
      {
        checked: false,
        text: 'bus',
        value: 'BUS',
      },
      {
        checked: true,
        text: 'boat',
        value: 'BOAT',
      },
    ])
  })

  describe('composeStatus', () => {
    const composeStatus = njk.getGlobal('composeStatus')
    const check = (status1: SectionStatus, status2: SectionStatus) => expect(composeStatus(status1, status2))

    it('check composing', () => {
      check(SectionStatus.COMPLETE, SectionStatus.COMPLETE).toEqual(SectionStatus.COMPLETE)
      check(SectionStatus.NOT_STARTED, SectionStatus.NOT_STARTED).toEqual(SectionStatus.NOT_STARTED)
      check(SectionStatus.INCOMPLETE, SectionStatus.INCOMPLETE).toEqual(SectionStatus.INCOMPLETE)

      check(SectionStatus.NOT_STARTED, SectionStatus.INCOMPLETE).toEqual(SectionStatus.INCOMPLETE)
      check(SectionStatus.NOT_STARTED, SectionStatus.COMPLETE).toEqual(SectionStatus.INCOMPLETE)
      check(SectionStatus.COMPLETE, SectionStatus.INCOMPLETE).toEqual(SectionStatus.INCOMPLETE)
    })
  })

  describe('toNoDataEnteredIfUndefined', () => {
    const toNoDataEnteredIfUndefined = njk.getFilter('toNoDataEnteredIfUndefined')
    it('returns "No data entered" for undefined', () => {
      expect(toNoDataEnteredIfUndefined(undefined)).toBe('No data entered')
    })
    it('returns value for defined input', () => {
      expect(toNoDataEnteredIfUndefined('Some value')).toBe('Some value')
      expect(toNoDataEnteredIfUndefined(0)).toBe(0)
      expect(toNoDataEnteredIfUndefined(false)).toBe(false)
      expect(toNoDataEnteredIfUndefined(null)).toBe(null)
    })
  })

  describe('toYesNoIfTrueFalse', () => {
    it('returns undefined for no value', () => {
      const result = njk.getFilter('toYesNoIfTrueFalse')()
      expect(result).toEqual(undefined)
    })
    it('returns Yes for string true', () => {
      const result = njk.getFilter('toYesNoIfTrueFalse')('true')
      expect(result).toEqual('Yes')
    })

    it('returns Yes for boolean true', () => {
      const result = njk.getFilter('toYesNoIfTrueFalse')(true)
      expect(result).toEqual('Yes')
    })
    it('returns No for string false', () => {
      const result = njk.getFilter('toYesNoIfTrueFalse')('false')
      expect(result).toEqual('No')
    })

    it('returns No for boolean false', () => {
      const result = njk.getFilter('toYesNoIfTrueFalse')(false)
      expect(result).toEqual('No')
    })
  })

  describe('toNoDataEntered', () => {
    const toNoDataEntered = njk.getFilter('toNoDataEntered')
    it('returns "No data entered" for empty string, null, undefined, "None", false, or en dash', () => {
      expect(toNoDataEntered('')).toBe('No data entered')
      expect(toNoDataEntered(null)).toBe('No data entered')
      expect(toNoDataEntered(undefined)).toBe('No data entered')
      expect(toNoDataEntered('None')).toBe('No data entered')
      expect(toNoDataEntered(false)).toBe('No data entered')
      expect(toNoDataEntered('\u2013')).toBe('No data entered')
    })
    it('returns "No data entered" for empty array or array with undefined as first element', () => {
      expect(toNoDataEntered([])).toBe('No data entered')
      expect(toNoDataEntered([undefined])).toBe('No data entered')
    })
    it('returns value for non-empty, non-matching values', () => {
      expect(toNoDataEntered('Some value')).toBe('Some value')
      expect(toNoDataEntered([1, 2])).toEqual([1, 2])
      expect(toNoDataEntered(123)).toBe(123)
      expect(toNoDataEntered(true)).toBe(true)
    })
  })

  describe('toNoDataEnteredIfNoOnly', () => {
    const toNoDataEnteredIfNoOnly = njk.getFilter('toNoDataEnteredIfNoOnly')
    it('returns "No data entered" for "No"', () => {
      expect(toNoDataEnteredIfNoOnly('No')).toBe('No data entered')
    })
    it('returns value for anything except "No"', () => {
      expect(toNoDataEnteredIfNoOnly('Yes')).toBe('Yes')
      expect(toNoDataEnteredIfNoOnly('Maybe')).toBe('Maybe')
      expect(toNoDataEnteredIfNoOnly('')).toBe('')
      expect(toNoDataEnteredIfNoOnly(null)).toBe(null)
    })
  })

  describe('toNoDataEnteredOrValue', () => {
    const toNoDataEnteredOrValue = njk.getFilter('toNoDataEnteredOrValue')
    it('returns "No data entered" for undefined, null, or empty string', () => {
      expect(toNoDataEnteredOrValue(undefined)).toBe('No data entered')
      expect(toNoDataEnteredOrValue(null)).toBe('No data entered')
      expect(toNoDataEnteredOrValue('')).toBe('No data entered')
    })
    it('returns "None" for string "None"', () => {
      expect(toNoDataEnteredOrValue('None')).toBe('None')
    })
    it('returns value for any other input', () => {
      expect(toNoDataEnteredOrValue('Some value')).toBe('Some value')
      expect(toNoDataEnteredOrValue(0)).toBe(0)
      expect(toNoDataEnteredOrValue(false)).toBe(false)
      expect(toNoDataEnteredOrValue([1, 2])).toEqual([1, 2])
    })
  })

  describe('activeStatus', () => {
    const filter = njk.getFilter('activeStatus')
    it('returns "Active" for true', () => {
      expect(filter(true)).toBe('Active')
    })
    it('returns "Inactive" for false', () => {
      expect(filter(false)).toBe('Inactive')
    })
  })
})
