import { invertGroupings, aggregatorFactory } from './aggregatorFunctions'

describe('Aggregator Functions', () => {
  describe('invertGroupings', () => {
    it('inverts empty grouping', () => {
      expect(invertGroupings({})).toEqual({})
    })

    it('inverts a single group with one member', () => {
      expect(invertGroupings({ A: { codes: ['X'] } })).toEqual({ X: 'A' })
    })

    it('inverts a single group with no members', () => {
      expect(invertGroupings({ A: { codes: undefined } })).toEqual({})
    })

    it('inverts a single group with many members', () => {
      expect(invertGroupings({ A: { codes: ['X', 'Y', 'Z'] } })).toEqual({ X: 'A', Y: 'A', Z: 'A' })
    })

    it('inverts many groups each having a single member', () => {
      expect(
        invertGroupings({
          A: { codes: ['X'] },
          B: { codes: ['Y'] },
          C: { codes: ['Z'] },
        })
      ).toEqual({
        X: 'A',
        Y: 'B',
        Z: 'C',
      })
    })

    it('inverts many groups with many members', () => {
      expect(
        invertGroupings({
          A: { codes: ['X', 'Y'] },
          B: { codes: ['P'] },
          C: { codes: ['L', 'M', 'N'] },
        })
      ).toEqual({
        L: 'C',
        M: 'C',
        N: 'C',
        P: 'B',
        X: 'A',
        Y: 'A',
      })
    })
  })

  describe('aggregatorFactory', () => {
    const EMPTY_GROUP = {}
    const ONE_GROUP = { A: { codes: ['X'] } }

    const THREE_GROUPS = {
      A: { codes: ['X'] },
      B: { codes: ['P', 'Q'] },
      C: { codes: ['L', 'M', 'N'] },
    }

    const DEFAULT_GROUP_NAME = 'DEFAULT'

    const THREE_GROUPS_AND_DEFAULT = {
      ...THREE_GROUPS,
      [DEFAULT_GROUP_NAME]: { codes: ['OTH'] },
    }

    const DEFAULT_COUNTS = { A: 0, B: 0, C: 0, [DEFAULT_GROUP_NAME]: 0 }

    it('empty grouping', () => {
      const aggregator = aggregatorFactory(EMPTY_GROUP, 'X', 'x')
      expect(aggregator({}, [])).toEqual({})
    })

    it('one group', () => {
      const aggregator = aggregatorFactory(ONE_GROUP, 'X', 'x')
      expect(aggregator({}, [])).toEqual({ A: 0 })
    })

    it('several groups', () => {
      const aggregator = aggregatorFactory(THREE_GROUPS, 'X', 'x')

      expect(aggregator({}, [])).toEqual({ A: 0, B: 0, C: 0 })
    })

    it('aggregates incidents for one offender', () => {
      const aggregator = aggregatorFactory(ONE_GROUP, 'X', 'religionCode')
      expect(aggregator({ O1: 1 }, [{ offenderNo: 'O1', religionCode: 'X' }])).toEqual({ A: 1 })
    })

    it('aggregates incidents for several offenders', () => {
      const aggregator = aggregatorFactory(ONE_GROUP, 'X', 'religionCode')
      expect(
        aggregator({ O1: 1, O2: 2, O3: 3 }, [
          { offenderNo: 'O1', religionCode: 'X' },
          { offenderNo: 'O2', religionCode: 'X' },
          { offenderNo: 'O3', religionCode: 'X' },
        ])
      ).toEqual({ A: 6 })
    })

    it('aggregates incidents for missing code', () => {
      const aggregator = aggregatorFactory(THREE_GROUPS_AND_DEFAULT, DEFAULT_GROUP_NAME, 'religionCode')
      expect(aggregator({ O1: 1 }, [{ offenderNo: 'O1' }])).toEqual({ ...DEFAULT_COUNTS, [DEFAULT_GROUP_NAME]: 1 })
    })

    it('aggregates incidents for unknown code', () => {
      const aggregator = aggregatorFactory(THREE_GROUPS_AND_DEFAULT, DEFAULT_GROUP_NAME, 'religionCode')
      expect(aggregator({ O1: 1 }, [{ offenderNo: 'O1', religionCode: 'XXX' }])).toEqual({
        ...DEFAULT_COUNTS,
        [DEFAULT_GROUP_NAME]: 1,
      })
    })

    it('distributes counts to groups', () => {
      const aggregator = aggregatorFactory(THREE_GROUPS_AND_DEFAULT, DEFAULT_GROUP_NAME, 'religionCode')
      expect(
        aggregator({ O1: 1, O2: 2, O3: 3 }, [
          { offenderNo: 'O1', religionCode: 'X' },
          { offenderNo: 'O2', religionCode: 'P' },
          { offenderNo: 'O3', religionCode: 'L' },
        ])
      ).toEqual({ ...DEFAULT_COUNTS, A: 1, B: 2, C: 3 })
    })

    it('aggregates counts across groups', () => {
      const aggregator = aggregatorFactory(THREE_GROUPS_AND_DEFAULT, DEFAULT_GROUP_NAME, 'religionCode')
      expect(
        aggregator({ O1: 1, O2: 2, O3: 3, O4: 10, O5: 20, O6: 30, O7: 40, O8: 50 }, [
          { offenderNo: 'O1', religionCode: 'X' },
          { offenderNo: 'O2', religionCode: 'P' },
          { offenderNo: 'O3', religionCode: 'L' },
          { offenderNo: 'O4', religionCode: 'X' },
          { offenderNo: 'O5', religionCode: 'Q' },
          { offenderNo: 'O6', religionCode: 'M' },
          { offenderNo: 'O7', religionCode: '-' },
          { offenderNo: 'O8', religionCode: null },
        ])
      ).toEqual({ A: 11, B: 22, C: 33, [DEFAULT_GROUP_NAME]: 90 })
    })
  })
})
