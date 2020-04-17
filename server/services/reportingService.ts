import moment from 'moment'
import stringify from 'csv-stringify'
import logger from '../../log'
import { HeatmapBuilder } from './heatmapBuilder'
import { Aggregator } from './incidentCountAggregator'
import religiousGroupAggregator from './religiousGroupAggregator'
import ethnicGroupAggregator from './ethnicGroupAggregator'
import { ageGroupCsvRendererConfig, aggregateIncidentsByAgeGroup } from './incidentsByAgeAggregator'
import { ReportStatus } from '../config/types'
import { DateRange, OffenderNoWithIncidentDate, OffenderService, ReportingClient } from '../types/uof'

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

const getIncidentCountsByOffenderNumber = async (
  reportingClient,
  agencyId,
  range: DateRange
): Promise<{ [offenderNo: string]: number }> => {
  const offenderNoWithIncidentCounts = await reportingClient.getIncidentCountByOffenderNo(agencyId, range)

  return offenderNoWithIncidentCounts.reduce((accumulator, { offenderNo, incidentCount }) => {
    accumulator[offenderNo] = parseInt(incidentCount, 10) || 0
    return accumulator
  }, {})
}

export default function createReportingService(
  reportingClient: ReportingClient,
  offenderService: OffenderService,
  heatmapBuilder: HeatmapBuilder
) {
  const aggregateIncidentsUsing = (aggregator: Aggregator) => async (token, agencyId, month, year) => {
    const range = dateRange(month, year)
    logger.info(`${aggregator.title} for agency: ${agencyId}, between '${formatRange(range)}'`)
    const incidentCountsByOffenderNumber = await getIncidentCountsByOffenderNumber(reportingClient, agencyId, range)

    const prisonersDetails = await offenderService.getPrisonersDetails(
      token,
      Object.keys(incidentCountsByOffenderNumber)
    )

    const answer = aggregator.aggregate(incidentCountsByOffenderNumber, prisonersDetails)

    return toCsv(aggregator.csvRendererConfiguration, [answer])
  }

  return {
    getMostOftenInvolvedStaff: async (agencyId, month, year) => {
      const range = dateRange(month, year)
      logger.info(`Retrieve most involved staff for agency: ${agencyId}, between '${formatRange(range)}'`)
      const results = await reportingClient.getMostOftenInvolvedStaff(agencyId, range)

      return toCsv(
        [
          { key: 'name', header: 'Staff member name' },
          { key: 'count', header: 'Count' },
        ],
        results
      )
    },

    getMostOftenInvolvedPrisoners: async (token, agencyId, month, year) => {
      const range = dateRange(month, year)
      logger.info(`Retrieve most involved prisoner for agency: ${agencyId}, between '${formatRange(range)}'`)
      const results = await reportingClient.getMostOftenInvolvedPrisoners(agencyId, range)

      const offenderNos = results.map(result => result.offenderNo)
      const nosToNames = await offenderService.getOffenderNames(token, offenderNos)

      const rows = results.map(({ offenderNo, count }) => ({ name: nosToNames[offenderNo], count }))

      return toCsv(
        [
          { key: 'name', header: 'Prisoner name' },
          { key: 'count', header: 'Count' },
        ],
        rows
      )
    },

    getIncidentsOverview: async (agencyId, month, year) => {
      const range = dateRange(month, year)
      logger.info(`Retrieve incident overview for agency: ${agencyId}, between '${formatRange(range)}'`)

      const [completeResults] = await reportingClient.getIncidentsOverview(agencyId, range, [
        ReportStatus.SUBMITTED,
        ReportStatus.COMPLETE,
      ])
      const [inprogressResults] = await reportingClient.getIncidentsOverview(agencyId, range, [
        ReportStatus.IN_PROGRESS,
      ])

      const results = [
        { ...completeResults, type: 'Complete' },
        { ...inprogressResults, type: 'In progress' },
      ]

      return toCsv(
        [
          { key: 'type', header: 'Type' },
          { key: 'total', header: 'Total' },
          { key: 'planned', header: 'Planned incidents' },
          { key: 'unplanned', header: 'Unplanned incidents' },
          { key: 'handcuffsApplied', header: 'Handcuffs applied' },
          { key: 'batonDrawn', header: 'Baton drawn' },
          { key: 'batonUsed', header: 'Baton used' },
          { key: 'pavaDrawn', header: 'Pava drawn' },
          { key: 'pavaUsed', header: 'Pava used' },
          { key: 'personalProtectionTechniques', header: 'Personal protection techniques' },
          { key: 'cctvRecording', header: 'CCTV recording' },
          { key: 'bodyWornCamera', header: 'Body worn camera recording' },
          { key: 'bodyWornCameraUnknown', header: 'Body worn camera recording unknown' },
        ],
        results
      )
    },

    getIncidentHeatmap: async (token, agencyId, month, year) => {
      const range = dateRange(month, year)
      logger.info(`Retrieve heatmap for agency: ${agencyId}, between '${formatRange(range)}'`)

      const results = await reportingClient.getIncidentLocationsAndTimes(agencyId, range)

      const heatmap = await heatmapBuilder.build(token, agencyId, results)

      return toCsv(
        [
          { key: 'location', header: 'Location' },
          { key: 'six', header: '06:00' },
          { key: 'seven', header: '07:00' },
          { key: 'eight', header: '08:00' },
          { key: 'nine', header: '09:00' },
          { key: 'ten', header: '10:00' },
          { key: 'eleven', header: '11:00' },
          { key: 'twelve', header: '12:00' },
          { key: 'onePm', header: '13:00' },
          { key: 'twoPm', header: '14:00' },
          { key: 'threePm', header: '15:00' },
          { key: 'fourPm', header: '16:00' },
          { key: 'fivePm', header: '17:00' },
          { key: 'sixPm', header: '18:00' },
          { key: 'sevenPm', header: '19:00' },
          { key: 'afterEight', header: '20:00+' },
        ],
        heatmap
      )
    },

    getIncidentsByReligiousGroup: aggregateIncidentsUsing(religiousGroupAggregator),
    getIncidentsByEthnicGroup: aggregateIncidentsUsing(ethnicGroupAggregator),

    getIncidentsByAgeGroup: async (token: string, agencyId: string, month: number, year: number): Promise<string> => {
      const range = dateRange(month, year)
      logger.info(`Retrieve incidents by age group for agency: ${agencyId}, between '${formatRange(range)}'`)

      const incidents = await reportingClient.getIncidentsForAgencyAndDateRange(token, range)

      const offenderNumbers = Array.from(
        incidents.reduce((offenderNos, { offenderNo }) => offenderNos.add(offenderNo), new Set<string>())
      )

      const prisonersDetails = await offenderService.getPrisonersDetails(token, offenderNumbers)

      const incidentsByAgeGroup = aggregateIncidentsByAgeGroup(incidents, prisonersDetails)
      return toCsv(ageGroupCsvRendererConfig, [incidentsByAgeGroup])
    },
  }
}
