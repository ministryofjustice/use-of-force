const logger = require('../../log')
const config = require('../config')
const createRestClientBuilder = require('./restClient')

const restClientBuilder = createRestClientBuilder('elite2api', config.apis.elite2)

module.exports = token => {
  const restClient = restClientBuilder(token)

  return {
    async getOffenderDetails(bookingId) {
      return restClient.get({ path: `/api/bookings/${bookingId}?basicInfo=false` })
    },
    async getOffenders(offenderNos) {
      return restClient.post({ path: '/api/bookings/offenders?activeOnly=false', data: offenderNos })
    },
    async getPrisoners(offenderNos) {
      const query = { offenderNo: offenderNos }
      const headers = { 'Page-Limit': 5000 }
      // @ts-ignore
      return restClient.get({ path: '/api/prisoners', query, headers })
    },
    async getUser() {
      return restClient.get({ path: '/api/users/me' })
    },
    getUserCaseLoads() {
      return restClient.get({ path: '/api/users/me/caseLoads' })
    },
    getPrisons() {
      return restClient.get({
        path: `/api/agencies/type/INST?active=true`,
      })
    },
    getLocations(agencyId, occurrenceLocationsOnly = true) {
      return restClient.get({
        path: `/api/agencies/${agencyId}/locations${occurrenceLocationsOnly ? '?eventType=OCCUR' : ''}`,
        headers: { 'Sort-Fields': 'userDescription' },
      })
    },
    getLocation(locationId) {
      return restClient.get({ path: `/api/locations/${locationId}` })
    },
    getOffenderImage(bookingId) {
      return restClient.stream({
        path: `/api/bookings/${bookingId}/image/data`,
        errorLogger: error =>
          error.status === 404
            ? logger.info(`No offender image available for: ${bookingId}`)
            : logger.warn(error, `Error calling elite2`),
      })
    },
  }
}
