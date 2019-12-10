const moment = require('moment')
const stringify = require('csv-stringify')
const logger = require('../../log')

const toCsv = (columns, results) =>
  new Promise((resolve, reject) => {
    stringify(results, { columns, header: true }, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })

module.exports = function createReportingService({ reportingClient, offenderService }) {
  return {
    getMostOftenInvolvedStaff: async (agencyId, month, year) => {
      const date = moment({ years: year, months: month - 1 })

      const startDate = moment(date).startOf('month')
      const endDate = moment(date).endOf('month')

      logger.info(
        `Retrieve most involved staff for agency: ${agencyId}, between '${startDate.format()}' and '${endDate.format()}'`
      )
      const results = await reportingClient.getMostOftenInvolvedStaff(agencyId, startDate, endDate)

      return toCsv([{ key: 'name', header: 'Staff member name' }, { key: 'count', header: 'Count' }], results)
    },

    getMostOftenInvolvedPrisoners: async (username, agencyId, month, year) => {
      const date = moment({ years: year, months: month - 1 })

      const startDate = moment(date).startOf('month')
      const endDate = moment(date).endOf('month')

      logger.info(
        `Retrieve most involved prisoner for agency: ${agencyId}, between '${startDate.format()}' and '${endDate.format()}'`
      )
      const results = await reportingClient.getMostOftenInvolvedPrisoners(agencyId, startDate, endDate)

      const offenderNos = results.map(result => result.offenderNo)
      const nosToNames = await offenderService.getOffenderNames(username, offenderNos)

      const rows = results.map(({ offenderNo, count }) => ({ name: nosToNames[offenderNo], count }))

      return toCsv([{ key: 'name', header: 'Prisoner name' }, { key: 'count', header: 'Count' }], rows)
    },
  }
}
