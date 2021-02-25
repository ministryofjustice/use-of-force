import { GROUPS, DEFAULT_GROUP } from './religiousGrouping'
import { Aggregator, aggregatorFactory, buildCsvRendererConfiguration } from '../incidentCountAggregator'

const aggregator: Aggregator = {
  title: 'Incidents by religion',
  aggregate: aggregatorFactory(GROUPS, DEFAULT_GROUP, 'religionCode'),
  csvRendererConfiguration: buildCsvRendererConfiguration(GROUPS),
}

export default aggregator
