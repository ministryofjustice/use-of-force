import { Aggregator, aggregatorFactory, buildCsvRendererConfiguration } from '../incidentCountAggregator'
import { GROUPS, DEFAULT_GROUP } from './ethnicGrouping'

const aggregator: Aggregator = {
  title: 'Incidents by ethnic group',
  aggregate: aggregatorFactory(GROUPS, DEFAULT_GROUP, 'ethnicityCode'),
  csvRendererConfiguration: buildCsvRendererConfiguration(GROUPS),
}

export default aggregator
