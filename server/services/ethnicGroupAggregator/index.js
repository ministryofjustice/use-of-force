const { GROUPS, DEFAULT_GROUP } = require('./ethnicGrouping')
const { aggregatorFactory, buildCsvRendererConfiguration } = require('../incidentCountAggregator')

module.exports = {
  aggregator: aggregatorFactory(GROUPS, DEFAULT_GROUP, 'ethnicityCode'),
  csvRendererConfiguration: buildCsvRendererConfiguration(GROUPS),
  title: 'Incidents by ethnic group',
}
