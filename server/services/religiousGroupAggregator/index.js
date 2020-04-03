const { GROUPS, DEFAULT_GROUP } = require('./religiousGrouping')
const { aggregatorFactory, buildCsvRendererConfiguration } = require('../incidentCountAggregator')

module.exports = {
  aggregator: aggregatorFactory(GROUPS, DEFAULT_GROUP, 'religionCode'),
  csvRendererConfiguration: buildCsvRendererConfiguration(GROUPS),
  title: 'Incidents by religion',
}
