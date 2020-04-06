import aggregator from './index'

describe('Ethnic Grouping', () => {
  describe('aggregator', () => {
    it('aggregates unknown codes to UNKNOWN group', () => {
      expect(
        aggregator.aggregate(
          {
            W: 1,
            X: 2,
            Y: 3,
          },
          [{ offenderNo: 'W', ethnicityCode: 'X' }, { offenderNo: 'X', ethnicityCode: 'Y' }, { offenderNo: 'Y' }]
        )
      ).toEqual({
        WHITE: 0,
        ASIAN: 0,
        BLACK: 0,
        MIXED: 0,
        OTHER: 0,
        UNKNOWN: 6,
      })
    })

    it('aggregates all known ethnicityCodes to all groups', () => {
      expect(
        aggregator.aggregate(
          {
            B01: 1,
            B02: 1,
            B03: 1,
            B04: 1,

            C01: 1,
            C02: 1,
            C03: 1,
            C04: 1,
            C05: 1,

            D01: 1,
            D02: 1,
            D03: 1,

            E01: 1,
            E02: 1,
            E03: 1,
            E04: 1,

            F01: 1,
            F02: 1,

            G01: 1,
            G02: 1,
            G03: 1,
          },
          [
            { offenderNo: 'B01', ethnicityCode: 'W1' },
            { offenderNo: 'B02', ethnicityCode: 'W2' },
            { offenderNo: 'B03', ethnicityCode: 'W3' },
            { offenderNo: 'B04', ethnicityCode: 'W9' },

            { offenderNo: 'C01', ethnicityCode: 'A1' },
            { offenderNo: 'C01', ethnicityCode: 'A2' },
            { offenderNo: 'C01', ethnicityCode: 'A3' },
            { offenderNo: 'C01', ethnicityCode: 'A4' },
            { offenderNo: 'C01', ethnicityCode: 'A9' },

            { offenderNo: 'D01', ethnicityCode: 'B1' },
            { offenderNo: 'D01', ethnicityCode: 'B2' },
            { offenderNo: 'D01', ethnicityCode: 'B9' },

            { offenderNo: 'E01', ethnicityCode: 'M1' },
            { offenderNo: 'E02', ethnicityCode: 'M2' },
            { offenderNo: 'E03', ethnicityCode: 'M3' },
            { offenderNo: 'E04', ethnicityCode: 'M9' },

            { offenderNo: 'F01', ethnicityCode: 'O2' },
            { offenderNo: 'F02', ethnicityCode: 'O9' },

            { offenderNo: 'G01', ethnicityCode: 'NS' },
            { offenderNo: 'G02', ethnicityCode: 'X1' },
            { offenderNo: 'G03' },
          ]
        )
      ).toEqual({
        WHITE: 4,
        ASIAN: 5,
        BLACK: 3,
        MIXED: 4,
        OTHER: 2,
        UNKNOWN: 3,
      })
    })
  })

  describe('csvRenderConfiguration', () => {
    it('should yield the configuration', () => {
      expect(aggregator.csvRendererConfiguration).toEqual([
        { header: 'White', key: 'WHITE' },
        { header: 'Asian or Asian British', key: 'ASIAN' },
        { header: 'Black or Black British', key: 'BLACK' },
        { header: 'Mixed Ethnic Groups', key: 'MIXED' },
        { header: 'Other Ethnic Group', key: 'OTHER' },
        { header: 'Not known', key: 'UNKNOWN' },
      ])
    })
  })
})
