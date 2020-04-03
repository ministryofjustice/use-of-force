/** @typedef {import('./heatmapBuilder').HeatmapBuilder} HeatmapBuilder */

const moment = require('moment')
const stringify = require('csv-stringify')
const logger = require('../../log')
const { ReportStatus } = require('../config/types')
const { incidentsByReligiousGroup, csvRendererConfiguration } = require('./religiousGrouping')

const toCsv = (columns, results) =>
  new Promise((resolve, reject) => {
    stringify(results, { columns, header: true }, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })

/** @return {[moment.Moment, moment.Moment]} */
const dateRange = (month, year) => {
  const date = moment({ years: year, months: month - 1 })

  const startDate = moment(date).startOf('month')
  const endDate = moment(date).endOf('month')
  return [startDate, endDate]
}

const formatRange = ([start, end]) => `${start.format()}' and '${end.format()}`

/**
 * @param {any} reportingClient
 * @param {any} offenderService
 * @param {HeatmapBuilder} heatmapBuilder
 */
module.exports = function createReportingService(reportingClient, offenderService, heatmapBuilder) {
  return {
    getMostOftenInvolvedStaff: async (agencyId, month, year) => {
      const range = dateRange(month, year)
      logger.info(`Retrieve most involved staff for agency: ${agencyId}, between '${formatRange(range)}'`)
      const results = await reportingClient.getMostOftenInvolvedStaff(agencyId, range)

      return toCsv([{ key: 'name', header: 'Staff member name' }, { key: 'count', header: 'Count' }], results)
    },

    getMostOftenInvolvedPrisoners: async (token, agencyId, month, year) => {
      const range = dateRange(month, year)
      logger.info(`Retrieve most involved prisoner for agency: ${agencyId}, between '${formatRange(range)}'`)
      const results = await reportingClient.getMostOftenInvolvedPrisoners(agencyId, range)

      const offenderNos = results.map(result => result.offenderNo)
      const nosToNames = await offenderService.getOffenderNames(token, offenderNos)

      const rows = results.map(({ offenderNo, count }) => ({ name: nosToNames[offenderNo], count }))

      return toCsv([{ key: 'name', header: 'Prisoner name' }, { key: 'count', header: 'Count' }], rows)
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

      const results = [{ ...completeResults, type: 'Complete' }, { ...inprogressResults, type: 'In progress' }]

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

    getIncidentsByReligiousGroup: async (token, agencyId, month, year) => {
      const range = dateRange(month, year)
      logger.info(`Retrieve incidents by religion for agency: ${agencyId}, between '${formatRange(range)}'`)

      const offenderNoWithIncidentCounts = await reportingClient.getIncidentCountByOffenderNo(agencyId, range)

      const offenderNumberToIncidentCount = offenderNoWithIncidentCounts.reduce(
        (accumulator, { offenderNo, incidentCount }) => {
          accumulator[offenderNo] = parseInt(incidentCount, 10) || 0
          return accumulator
        },
        {}
      )

      const prisonersDetails = await offenderService.getPrisonersDetails(
        token,
        Object.keys(offenderNumberToIncidentCount)
      )

      const answer = incidentsByReligiousGroup(offenderNumberToIncidentCount, prisonersDetails)
      return toCsv(csvRendererConfiguration, [answer])
    },
  }
}
