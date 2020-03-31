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
      expect(aggregator({ O1: 1 }, [{ offenderNo: 'O1', religion: 'X' }])).toEqual({ A: 1 })
    })

    it('aggregates incidents for several offenders', () => {
      const aggregator = incidentsByReligiousGroupFactory(ONE_GROUP)
      expect(
        aggregator({ O1: 1, O2: 2, O3: 3 }, [
          { offenderNo: 'O1', religion: 'X' },
          { offenderNo: 'O2', religion: 'X' },
          { offenderNo: 'O3', religion: 'X' },
        ])
      ).toEqual({ A: 6 })
    })

    it('aggregates incidents for missing religion', () => {
      const aggregator = incidentsByReligiousGroupFactory(THREE_GROUPS_AND_OTHER)
      expect(aggregator({ O1: 1 }, [{ offenderNo: 'O1' }])).toEqual({ ...DEFAULT_COUNTS, [OTHER_GROUP]: 1 })
    })

    it('aggregates incidents for unknown religion', () => {
      const aggregator = incidentsByReligiousGroupFactory(THREE_GROUPS_AND_OTHER)
      expect(aggregator({ O1: 1 }, [{ offenderNo: 'O1', religion: 'XXX' }])).toEqual({
        ...DEFAULT_COUNTS,
        [OTHER_GROUP]: 1,
      })
    })

    it('distributes counts to groups', () => {
      const aggregator = incidentsByReligiousGroupFactory(THREE_GROUPS_AND_OTHER)
      expect(
        aggregator({ O1: 1, O2: 2, O3: 3 }, [
          { offenderNo: 'O1', religion: 'X' },
          { offenderNo: 'O2', religion: 'P' },
          { offenderNo: 'O3', religion: 'L' },
        ])
      ).toEqual({ ...DEFAULT_COUNTS, A: 1, B: 2, C: 3 })
    })

    it('aggregates counts accross groups', () => {
      const aggregator = incidentsByReligiousGroupFactory(THREE_GROUPS_AND_OTHER)
      expect(
        aggregator({ O1: 1, O2: 2, O3: 3, O4: 10, O5: 20, O6: 30, O7: 40, O8: 50 }, [
          { offenderNo: 'O1', religion: 'X' },
          { offenderNo: 'O2', religion: 'P' },
          { offenderNo: 'O3', religion: 'L' },
          { offenderNo: 'O4', religion: 'X' },
          { offenderNo: 'O5', religion: 'Q' },
          { offenderNo: 'O6', religion: 'M' },
          { offenderNo: 'O7', religion: '-' },
          { offenderNo: 'O8', religion: null },
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
            { offenderNo: 'W', religion: 'UNKN' },
            { offenderNo: 'X', religion: 'AGNO' },
            { offenderNo: 'Y', religion: 'ATHE' },
            { offenderNo: 'Z', religion: 'NIL' },
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
            { offenderNo: 'X', religion: 'XXXXXXX' },
            { offenderNo: 'Y', religion: 'NONP' },
            { offenderNo: 'Z', religion: 'OTH' },
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
            { offenderNo: 'A01', religion: 'SIKH' },
            { offenderNo: 'B01', religion: 'ADV' },
            { offenderNo: 'B02', religion: 'BAPT' },
            { offenderNo: 'B03', religion: 'CALV' },
            { offenderNo: 'B04', religion: 'CCOG' },
            { offenderNo: 'B05', religion: 'CE' },
            { offenderNo: 'B06', religion: 'CHRST' },
            { offenderNo: 'B07', religion: 'CHSC' },
            { offenderNo: 'B08', religion: 'CINW' },
            { offenderNo: 'B09', religion: 'COFE' },
            { offenderNo: 'B10', religion: 'COFI' },
            { offenderNo: 'B11', religion: 'COFN' },
            { offenderNo: 'B12', religion: 'COFS' },
            { offenderNo: 'B13', religion: 'CONG' },
            { offenderNo: 'B14', religion: 'COPT' },
            { offenderNo: 'B15', religion: 'CSW' },
            { offenderNo: 'B16', religion: 'EODX' },
            { offenderNo: 'B17', religion: 'EORTH' },
            { offenderNo: 'B18', religion: 'EPIS' },
            { offenderNo: 'B19', religion: 'ETHO' },
            { offenderNo: 'B20', religion: 'EVAN' },
            { offenderNo: 'B21', religion: 'GOSP' },
            { offenderNo: 'B22', religion: 'GROX' },
            { offenderNo: 'B23', religion: 'JEHV' },
            { offenderNo: 'B24', religion: 'METH' },
            { offenderNo: 'B25', religion: 'MORM' },
            { offenderNo: 'B26', religion: 'NONC' },
            { offenderNo: 'B27', religion: 'OORTH' },
            { offenderNo: 'B28', religion: 'PENT' },
            { offenderNo: 'B29', religion: 'PRES' },
            { offenderNo: 'B30', religion: 'PROT' },
            { offenderNo: 'B31', religion: 'QUAK' },
            { offenderNo: 'B32', religion: 'RC' },
            { offenderNo: 'B33', religion: 'RUSS' },
            { offenderNo: 'B34', religion: 'SALV' },
            { offenderNo: 'B35', religion: 'SDAY' },
            { offenderNo: 'B36', religion: 'UNIT' },
            { offenderNo: 'B37', religion: 'UR' },
            { offenderNo: 'B38', religion: 'WELS' },

            { offenderNo: 'C01', religion: 'BUDD' },

            { offenderNo: 'D01', religion: 'HARE' },
            { offenderNo: 'D02', religion: 'HIND' },

            { offenderNo: 'E01', religion: 'JEW' },

            { offenderNo: 'F01', religion: 'BLAC' },
            { offenderNo: 'F02', religion: 'MOS' },
            { offenderNo: 'F03', religion: 'SHIA' },
            { offenderNo: 'F04', religion: 'SUNI' },

            { offenderNo: 'G01', religion: 'NIL' },

            { offenderNo: 'H01', religion: 'AGNO' },
            { offenderNo: 'H02', religion: 'ATHE' },
            { offenderNo: 'H03', religion: 'NIL' },
            { offenderNo: 'H04', religion: 'UNKN' },

            { offenderNo: 'I01', religion: 'APO' },
            { offenderNo: 'I02', religion: 'BAHA' },
            { offenderNo: 'I03', religion: 'DRU' },
            { offenderNo: 'I04', religion: 'HUM' },
            { offenderNo: 'I05', religion: 'JAIN' },
            { offenderNo: 'I06', religion: 'LUTH' },
            { offenderNo: 'I07', religion: 'PAG' },
            { offenderNo: 'I08', religion: 'PARS' },
            { offenderNo: 'I09', religion: 'RAST' },
            { offenderNo: 'I10', religion: 'SATN' },
            { offenderNo: 'I11', religion: 'SCIE' },
            { offenderNo: 'I12', religion: 'SHIN' },
            { offenderNo: 'I13', religion: 'SPIR' },
            { offenderNo: 'I14', religion: 'TAO' },
            { offenderNo: 'I15', religion: 'UNIF' },
            { offenderNo: 'I16', religion: 'ZORO' },

            { offenderNo: 'J01', religion: 'NONP' },
            { offenderNo: 'J02', religion: RELIGION_UNKNOWN },
            { offenderNo: 'J03' },
            { offenderNo: 'J04', religion: 'XXX' },
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
