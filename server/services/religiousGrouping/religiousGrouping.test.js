const {
  invertGroupings,
  incidentsByReligiousGroupFactory,
  incidentsByReligiousGroup,
  RELIGION_UNKNOWN,
  OTHER_GROUP,
  csvRendererConfiguration,
} = require('./religiousGrouping')

describe('Religious Groupings logic', () => {
  describe('invertGroupings', () => {
    it('inverts empty grouping', () => {
      expect(invertGroupings({})).toEqual({})
    })

    it('inverts a single group with one member', () => {
      expect(invertGroupings({ A: { religions: ['X'] } })).toEqual({ X: 'A' })
    })

    it('inverts a single group with no members', () => {
      expect(invertGroupings({ A: {} })).toEqual({})
    })

    it('inverts a single group with many members', () => {
      expect(invertGroupings({ A: { religions: ['X', 'Y', 'Z'] } })).toEqual({ X: 'A', Y: 'A', Z: 'A' })
    })

    it('inverts many groups each having a single member', () => {
      expect(
        invertGroupings({
          A: { religions: ['X'] },
          B: { religions: ['Y'] },
          C: { religions: ['Z'] },
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
          A: { religions: ['X', 'Y'] },
          B: { religions: ['P'] },
          C: { religions: ['L', 'M', 'N'] },
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

  describe('incidentsByReligiousGroupFactory', () => {
    const EMPTY_GROUP = {}
    const ONE_GROUP = { A: { religions: ['X'] } }

    const THREE_GROUPS = {
      A: { religions: ['X'] },
      B: { religions: ['P', 'Q'] },
      C: { religions: ['L', 'M', 'N'] },
    }

    const THREE_GROUPS_AND_OTHER = {
      ...THREE_GROUPS,
      [OTHER_GROUP]: { religions: [RELIGION_UNKNOWN] },
    }

    const DEFAULT_COUNTS = { A: 0, B: 0, C: 0, [OTHER_GROUP]: 0 }

    it('empty grouping', () => {
      const aggregator = incidentsByReligiousGroupFactory(EMPTY_GROUP)
      expect(aggregator({}, [])).toEqual({})
    })

    it('one group', () => {
      const aggregator = incidentsByReligiousGroupFactory(ONE_GROUP)
      expect(aggregator({}, [])).toEqual({ A: 0 })
    })

    it('several groups', () => {
      const aggregator = incidentsByReligiousGroupFactory(THREE_GROUPS)

      expect(aggregator({}, [])).toEqual({ A: 0, B: 0, C: 0 })
    })

    it('aggregates incidents for one offender', () => {
      const aggregator = incidentsByReligiousGroupFactory(ONE_GROUP)
      expect(aggregator({ O1: 1 }, [{ offenderNo: 'O1', religionCode: 'X' }])).toEqual({ A: 1 })
    })

    it('aggregates incidents for several offenders', () => {
      const aggregator = incidentsByReligiousGroupFactory(ONE_GROUP)
      expect(
        aggregator({ O1: 1, O2: 2, O3: 3 }, [
          { offenderNo: 'O1', religionCode: 'X' },
          { offenderNo: 'O2', religionCode: 'X' },
          { offenderNo: 'O3', religionCode: 'X' },
        ])
      ).toEqual({ A: 6 })
    })

    it('aggregates incidents for missing religion', () => {
      const aggregator = incidentsByReligiousGroupFactory(THREE_GROUPS_AND_OTHER)
      expect(aggregator({ O1: 1 }, [{ offenderNo: 'O1' }])).toEqual({ ...DEFAULT_COUNTS, [OTHER_GROUP]: 1 })
    })

    it('aggregates incidents for unknown religion', () => {
      const aggregator = incidentsByReligiousGroupFactory(THREE_GROUPS_AND_OTHER)
      expect(aggregator({ O1: 1 }, [{ offenderNo: 'O1', religionCode: 'XXX' }])).toEqual({
        ...DEFAULT_COUNTS,
        [OTHER_GROUP]: 1,
      })
    })

    it('distributes counts to groups', () => {
      const aggregator = incidentsByReligiousGroupFactory(THREE_GROUPS_AND_OTHER)
      expect(
        aggregator({ O1: 1, O2: 2, O3: 3 }, [
          { offenderNo: 'O1', religionCode: 'X' },
          { offenderNo: 'O2', religionCode: 'P' },
          { offenderNo: 'O3', religionCode: 'L' },
        ])
      ).toEqual({ ...DEFAULT_COUNTS, A: 1, B: 2, C: 3 })
    })

    it('aggregates counts across groups', () => {
      const aggregator = incidentsByReligiousGroupFactory(THREE_GROUPS_AND_OTHER)
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
      ).toEqual({ A: 11, B: 22, C: 33, [OTHER_GROUP]: 90 })
    })
  })

  describe('incidentsByReligiousGroup', () => {
    it('aggregates unknown religion, AGNO, ATHE and UNKN to OTHER_GROUP', () => {
      expect(
        incidentsByReligiousGroup(
          {
            W: 1,
            X: 2,
            Y: 3,
            Z: 4,
          },
          [
            { offenderNo: 'W', religionCode: 'UNKN' },
            { offenderNo: 'X', religionCode: 'AGNO' },
            { offenderNo: 'Y', religionCode: 'ATHE' },
            { offenderNo: 'Z', religionCode: 'NIL' },
          ]
        )
      ).toEqual({
        BUDDHIST: 0,
        CHRISTIAN: 0,
        HINDU: 0,
        JEWISH: 0,
        MUSLIM: 0,
        NONE: 10,
        OTHER: 0,
        OTHER_RELIGIOUS: 0,
        SIKH: 0,
      })
    })

    it('aggregates not recognised, not recorded, NONP and OTH to OTHER group ', () => {
      expect(
        incidentsByReligiousGroup(
          {
            W: 1,
            X: 2,
            Y: 3,
            Z: 4,
          },
          [
            { offenderNo: 'W' },
            { offenderNo: 'X', religionCode: 'XXXXXXX' },
            { offenderNo: 'Y', religionCode: 'NONP' },
            { offenderNo: 'Z', religionCode: 'OTH' },
          ]
        )
      ).toEqual({
        BUDDHIST: 0,
        CHRISTIAN: 0,
        HINDU: 0,
        JEWISH: 0,
        MUSLIM: 0,
        NONE: 0,
        OTHER: 10,
        OTHER_RELIGIOUS: 0,
        SIKH: 0,
      })
    })

    it('aggregates all known religions to all groups', () => {
      expect(
        incidentsByReligiousGroup(
          {
            A01: 1,

            B01: 1,
            B02: 1,
            B03: 1,
            B04: 1,
            B05: 1,
            B06: 1,
            B07: 1,
            B08: 1,
            B09: 1,
            B10: 1,
            B11: 1,
            B12: 1,
            B13: 1,
            B14: 1,
            B15: 1,
            B16: 1,
            B17: 1,
            B18: 1,
            B19: 1,
            B20: 1,
            B21: 1,
            B22: 1,
            B23: 1,
            B24: 1,
            B25: 1,
            B26: 1,
            B27: 1,
            B28: 1,
            B29: 1,
            B30: 1,
            B31: 1,
            B32: 1,
            B33: 1,
            B34: 1,
            B35: 1,
            B36: 1,
            B37: 1,
            B38: 1,

            C01: 1,

            D01: 1,
            D02: 1,

            E01: 1,

            F01: 1,
            F02: 1,
            F03: 1,
            F04: 1,

            G01: 1,

            H01: 1,
            H02: 1,
            H03: 1,
            H04: 1,

            I01: 1,
            I02: 1,
            I03: 1,
            I04: 1,
            I05: 1,
            I06: 1,
            I07: 1,
            I08: 1,
            I09: 1,
            I10: 1,
            I11: 1,
            I12: 1,
            I13: 1,
            I14: 1,
            I15: 1,
            I16: 1,

            J01: 1,
            J02: 1,
            J03: 1,
            J04: 1,
          },
          [
            { offenderNo: 'A01', religionCode: 'SIKH' },
            { offenderNo: 'B01', religionCode: 'ADV' },
            { offenderNo: 'B02', religionCode: 'BAPT' },
            { offenderNo: 'B03', religionCode: 'CALV' },
            { offenderNo: 'B04', religionCode: 'CCOG' },
            { offenderNo: 'B05', religionCode: 'CE' },
            { offenderNo: 'B06', religionCode: 'CHRST' },
            { offenderNo: 'B07', religionCode: 'CHSC' },
            { offenderNo: 'B08', religionCode: 'CINW' },
            { offenderNo: 'B09', religionCode: 'COFE' },
            { offenderNo: 'B10', religionCode: 'COFI' },
            { offenderNo: 'B11', religionCode: 'COFN' },
            { offenderNo: 'B12', religionCode: 'COFS' },
            { offenderNo: 'B13', religionCode: 'CONG' },
            { offenderNo: 'B14', religionCode: 'COPT' },
            { offenderNo: 'B15', religionCode: 'CSW' },
            { offenderNo: 'B16', religionCode: 'EODX' },
            { offenderNo: 'B17', religionCode: 'EORTH' },
            { offenderNo: 'B18', religionCode: 'EPIS' },
            { offenderNo: 'B19', religionCode: 'ETHO' },
            { offenderNo: 'B20', religionCode: 'EVAN' },
            { offenderNo: 'B21', religionCode: 'GOSP' },
            { offenderNo: 'B22', religionCode: 'GROX' },
            { offenderNo: 'B23', religionCode: 'JEHV' },
            { offenderNo: 'B24', religionCode: 'METH' },
            { offenderNo: 'B25', religionCode: 'MORM' },
            { offenderNo: 'B26', religionCode: 'NONC' },
            { offenderNo: 'B27', religionCode: 'OORTH' },
            { offenderNo: 'B28', religionCode: 'PENT' },
            { offenderNo: 'B29', religionCode: 'PRES' },
            { offenderNo: 'B30', religionCode: 'PROT' },
            { offenderNo: 'B31', religionCode: 'QUAK' },
            { offenderNo: 'B32', religionCode: 'RC' },
            { offenderNo: 'B33', religionCode: 'RUSS' },
            { offenderNo: 'B34', religionCode: 'SALV' },
            { offenderNo: 'B35', religionCode: 'SDAY' },
            { offenderNo: 'B36', religionCode: 'UNIT' },
            { offenderNo: 'B37', religionCode: 'UR' },
            { offenderNo: 'B38', religionCode: 'WELS' },

            { offenderNo: 'C01', religionCode: 'BUDD' },

            { offenderNo: 'D01', religionCode: 'HARE' },
            { offenderNo: 'D02', religionCode: 'HIND' },

            { offenderNo: 'E01', religionCode: 'JEW' },

            { offenderNo: 'F01', religionCode: 'BLAC' },
            { offenderNo: 'F02', religionCode: 'MOS' },
            { offenderNo: 'F03', religionCode: 'SHIA' },
            { offenderNo: 'F04', religionCode: 'SUNI' },

            { offenderNo: 'G01', religionCode: 'NIL' },

            { offenderNo: 'H01', religionCode: 'AGNO' },
            { offenderNo: 'H02', religionCode: 'ATHE' },
            { offenderNo: 'H03', religionCode: 'NIL' },
            { offenderNo: 'H04', religionCode: 'UNKN' },

            { offenderNo: 'I01', religionCode: 'APO' },
            { offenderNo: 'I02', religionCode: 'BAHA' },
            { offenderNo: 'I03', religionCode: 'DRU' },
            { offenderNo: 'I04', religionCode: 'HUM' },
            { offenderNo: 'I05', religionCode: 'JAIN' },
            { offenderNo: 'I06', religionCode: 'LUTH' },
            { offenderNo: 'I07', religionCode: 'PAG' },
            { offenderNo: 'I08', religionCode: 'PARS' },
            { offenderNo: 'I09', religionCode: 'RAST' },
            { offenderNo: 'I10', religionCode: 'SATN' },
            { offenderNo: 'I11', religionCode: 'SCIE' },
            { offenderNo: 'I12', religionCode: 'SHIN' },
            { offenderNo: 'I13', religionCode: 'SPIR' },
            { offenderNo: 'I14', religionCode: 'TAO' },
            { offenderNo: 'I15', religionCode: 'UNIF' },
            { offenderNo: 'I16', religionCode: 'ZORO' },

            { offenderNo: 'J01', religionCode: 'NONP' },
            { offenderNo: 'J02', religionCode: RELIGION_UNKNOWN },
            { offenderNo: 'J03' },
            { offenderNo: 'J04', religionCode: 'XXX' },
          ]
        )
      ).toEqual({
        BUDDHIST: 1,
        CHRISTIAN: 38,
        HINDU: 2,
        JEWISH: 1,
        MUSLIM: 4,
        NONE: 5,
        [OTHER_GROUP]: 4,
        OTHER_RELIGIOUS: 16,
        SIKH: 1,
      })
    })
  })

  describe('csvRenderConfiguration', () => {
    it('should yield the configuration', () => {
      expect(csvRendererConfiguration).toContainEqual({ key: 'NONE', header: 'No religion' })
    })
  })
})
