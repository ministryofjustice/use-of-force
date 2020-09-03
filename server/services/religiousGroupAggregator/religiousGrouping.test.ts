import aggregator from './index'
import { PrisonerDetail } from '../../data/elite2ClientBuilderTypes'

describe('Religious Grouping', () => {
  describe('aggregator', () => {
    it('aggregates unknown religion, AGNO, ATHE and UNKN to OTHER_GROUP', () => {
      expect(
        aggregator.aggregate(
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
          ] as PrisonerDetail[]
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
        aggregator.aggregate(
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
          ] as PrisonerDetail[]
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

    it('aggregates all known religionCodes to all groups', () => {
      expect(
        aggregator.aggregate(
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
            { offenderNo: 'J02', religionCode: 'OTH' },
            { offenderNo: 'J03' },
            { offenderNo: 'J04', religionCode: 'XXX' },
          ] as PrisonerDetail[]
        )
      ).toEqual({
        BUDDHIST: 1,
        CHRISTIAN: 38,
        HINDU: 2,
        JEWISH: 1,
        MUSLIM: 4,
        NONE: 5,
        OTHER: 4,
        OTHER_RELIGIOUS: 16,
        SIKH: 1,
      })
    })
  })

  describe('csvRenderConfiguration', () => {
    it('should yield the configuration', () => {
      expect(aggregator.csvRendererConfiguration).toEqual([
        { header: 'Buddhist', key: 'BUDDHIST' },
        { header: 'Christian', key: 'CHRISTIAN' },
        { header: 'Hindu', key: 'HINDU' },
        { header: 'Jewish', key: 'JEWISH' },
        { header: 'Muslim', key: 'MUSLIM' },
        { header: 'No religion', key: 'NONE' },
        { header: 'Not recognised / not recorded', key: 'OTHER' },
        { header: 'Other', key: 'OTHER_RELIGIOUS' },
        { header: 'Sikh', key: 'SIKH' },
      ])
    })
  })
})
