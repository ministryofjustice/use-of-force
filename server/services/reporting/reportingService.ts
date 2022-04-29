import moment from 'moment'
import { stringify } from 'csv-stringify'
import logger from '../../../log'
import { HeatmapBuilder } from './heatmapBuilder'
import { Aggregator } from './incidentCountAggregator'
import religiousGroupAggregator from './religiousGroupAggregator'
import ethnicGroupAggregator from './ethnicGroupAggregator'
import { ageGroupCsvRendererConfig, aggregateIncidentsByAgeGroup } from './incidentsByAgeAggregator'
import { ReportStatus } from '../../config/types'
import { AgencyId, DateRange } from '../../types/uof'
import type OffenderService from '../offenderService'

const toCsv = (columns, results): Promise<string> =>
  new Promise((resolve, reject) => {
    stringify(results, { columns, header: true }, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })

const dateRange = (month, year): DateRange => {
  const date = moment({ years: year, months: month - 1 })

  const startDate = moment(date).startOf('month')
  const endDate = moment(date).endOf('month')
  return [startDate, endDate]
}

const formatRange = ([start, end]): string => `${start.format()}' and '${end.format()}`

export default class ReportingService {
  constructor(
    private readonly offenderService: OffenderService,
    private readonly heatmapBuilder: HeatmapBuilder
  ) {}

}
