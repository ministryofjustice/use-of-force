const R = require('ramda')
const { isNilOrEmpty } = require('../../utils/utils')

// [a] -> a -> boolean
const inList = R.flip(R.includes)

// [a] -> a -> boolean
const notInList = R.pipe(
  inList,
  R.complement
)

// location -> boolean
const firstLevelLocationsFilterFn = R.where({
  parentLocationId: isNilOrEmpty,
  locationType: notInList(['BOX', 'WING', 'RTU']),
  locationId: R.complement(isNilOrEmpty),
})

// [location] -> [location]
const firstLevelLocationsFilter = R.filter(firstLevelLocationsFilterFn)

// [locationId] -> location -> boolean
const secondLevelLocationsFilterFnFactory = firstLevelLocationIds =>
  R.where({
    parentLocationId: inList(firstLevelLocationIds),
    locationType: notInList(['BOX']),
  })

// [location] -> location -> boolean
const locationsFilterFnFactory = R.pipe(
  firstLevelLocationsFilter,
  R.pluck('locationId'),
  secondLevelLocationsFilterFnFactory
)

// [location] -> [location]
const locationsFilter = R.chain(R.filter, locationsFilterFnFactory)

module.exports = {
  notInList,
  firstLevelLocationsFilterFn,
  firstLevelLocationsFilter,
  locationsFilter,
}
