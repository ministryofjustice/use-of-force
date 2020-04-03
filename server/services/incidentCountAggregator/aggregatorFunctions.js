const R = require('ramda')

const invertGroupings = R.pipe(
  R.toPairs,
  R.chain(([groupName, { codes }]) => (codes ? codes.map(code => [code, groupName]) : [])),
  R.fromPairs,
  Object.freeze
)

const aggregatorFactory = (codesByGroup, defaultGroup, prisonerDetailPropertyName) => {
  const groupsByCode = invertGroupings(codesByGroup)

  return (offenderNumberToIncidentCountMap, prisonersDetails) =>
    prisonersDetails.reduce((accumulator, prisonerDetail) => {
      const code = prisonerDetail[prisonerDetailPropertyName]

      const group = groupsByCode[code] || defaultGroup
      const accumulatedCount = accumulator[group]
      accumulator[group] = accumulatedCount + offenderNumberToIncidentCountMap[prisonerDetail.offenderNo]
      return accumulator
    }, R.map(() => 0, codesByGroup))
}

const buildCsvRendererConfiguration = groups =>
  Object.entries(groups).map(([group, { description }]) => ({
    key: group,
    header: description,
  }))

module.exports = {
  invertGroupings,
  aggregatorFactory,
  buildCsvRendererConfiguration,
}
