import { CsvRendererConfiguration, IncidentsByPrisonerPropertyAggregator } from './aggregatorFunctions'

export { aggregatorFactory, buildCsvRendererConfiguration } from './aggregatorFunctions'

export interface Aggregator {
  title: string
  aggregate: IncidentsByPrisonerPropertyAggregator
  csvRendererConfiguration: CsvRendererConfiguration
}
