const R = require('ramda')

const {
  notInList,
  firstLevelLocationsFilterFn,
  firstLevelLocationsFilter,
  locationsFilter,
} = require('./locationsFilter')

describe('locationHelpers', () => {
  describe('notIn', () => {
    it(' P notIn X, Y, Z should be true', () => {
      expect(notInList(['X', 'Y', 'Z'])('P')).toBe(true)
    })
    it('Y not in X, Y, Z should be false', () => {
      expect(notInList(['X', 'Y', 'Z'])('Y')).toBe(false)
    })
  })

  describe('firstLevelFilterFn', () => {
    it('accepts anything that does not have a parentLocationId, has a locationId and a locationType of X. 1', () => {
      expect(
        firstLevelLocationsFilterFn({
          locationId: 1,
          locationType: 'X',
        })
      ).toBe(true)
    })

    it('accepts anything that has an undefined parentLocationId, has a locationId and a locationType of X. 2', () => {
      expect(
        firstLevelLocationsFilterFn({
          parentLocationId: undefined,
          locationId: 1,
          locationType: 'X',
        })
      ).toBe(true)
    })

    it('accepts anything that has a null parentLocationId, has a locationId and a locationType of X. 2', () => {
      expect(
        firstLevelLocationsFilterFn({
          parentLocationId: null,
          locationId: 1,
          locationType: 'X',
        })
      ).toBe(true)
    })

    it('rejects anything that has a parentLocationId', () => {
      expect(
        firstLevelLocationsFilterFn({
          parentLocationId: 1,
          locationId: 1,
          locationType: 'X',
        })
      ).toBe(false)
    })

    it('rejects anything that does not have a locationId', () => {
      expect(
        firstLevelLocationsFilterFn({
          locationType: 'X',
        })
      ).toBe(false)
    })

    it('rejects anything that does not have a parentLocationId, has a locationId and a locationType of BOX', () => {
      expect(
        firstLevelLocationsFilterFn({
          locationId: 1,
          locationType: 'BOX',
        })
      ).toBe(false)
    })
  })

  describe('filtering functions', () => {
    const locations = [
      { locationId: 1, parentLocationId: null, locationType: 'WING' },
      { locationId: 2, parentLocationId: null, locationType: 'RTU' },
      { locationId: 3, parentLocationId: null, locationType: 'BOX' },
      { locationId: 4, parentLocationId: null, locationType: 'RESI' },
      { locationId: 5, parentLocationId: null, locationType: 'RESI' },
      { locationId: 6, parentLocationId: 4, locationType: 'LAND' },
      { locationId: 7, parentLocationId: 5, locationType: 'WORKSHOP' },
      { locationId: 8, parentLocationId: 5, locationType: 'BOX' },
      { locationId: 9, parentLocationId: 6, locationType: 'RESI' },
      { locationId: 10, parentLocationId: 100, locationType: 'RESI' },
    ]
    describe('firstLevelLocationsFilter', () => {
      it('filters correctly', () => {
        expect(firstLevelLocationsFilter(locations)).toEqual([
          { locationId: 4, parentLocationId: null, locationType: 'RESI' },
          { locationId: 5, parentLocationId: null, locationType: 'RESI' },
        ])
      })

      it('plucks the filtered ids', () => {
        expect(
          R.pipe(
            firstLevelLocationsFilter,
            R.pluck('locationId')
          )(locations)
        ).toEqual(expect.arrayContaining([4, 5]))
      })
    })

    describe('locationsFilter', () => {
      it('filters by the filtered ids', () => {
        expect(locationsFilter(locations)).toEqual([
          { locationId: 6, parentLocationId: 4, locationType: 'LAND' },
          { locationId: 7, parentLocationId: 5, locationType: 'WORKSHOP' },
        ])
      })
    })
  })

  describe('filters sample data as expected', () => {
    const locations = [
      { locationType: 'BOX', userDescription: 'Box 1' },
      { locationType: 'WING', userDescription: 'Wing A' },
      { locationType: 'WING', userDescription: '' },
      { locationType: 'CELL', userDescription: 'Cell A' },
    ]

    it('firstLevelLocationFilter', () => {
      expect(firstLevelLocationsFilter(locations)).toEqual([])
    })

    it('plucks locationId as expected', () => {
      expect(R.pluck('locationId')([{ locationType: 'CELL', userDescription: 'Cell A' }])).toEqual([undefined])
    })

    it('applies locationsFilterCorrectly', () => {
      expect(locationsFilter(locations)).toEqual([])
    })

    it('treats undefined equal to undefined', () => {
      expect(R.equals(undefined, undefined)).toBe(true)
    })
  })
})
