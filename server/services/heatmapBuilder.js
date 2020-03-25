const moment = require('moment')

/**
 * @typedef Incident
 * @type {object}
 * @property {Date} incidentDate
 * @property {number} locationId
 */

/**
 * @typedef HeatmapRow
 * @type {object}
 * @property {string} location
 * @property {number} six (06:00 -> 06:59)
 * @property {number} seven
 * @property {number} eight
 * @property {number} nine
 * @property {number} ten
 * @property {number} eleven
 * @property {number} twelve
 * @property {number} onePm
 * @property {number} twoPm
 * @property {number} threePm
 * @property {number} fourPm
 * @property {number} fivePm
 * @property {number} sixPm
 * @property {number} sevenPm (19:00 -> 19:59)
 * @property {number} afterEight
 * @property {number} totalCount
 */

/**
 * @typedef {HeatmapRow[]} Heatmap
 */

/** @typedef {(locationId: number) => string} LocationFinder */

/**
 * @typedef HeatmapBuilder
 * @property {(token: string, agencyId: string, incidents: Incident[]) => Promise<Heatmap>} build
 */

/** @returns {HeatmapBuilder} */
module.exports = function createHeatmapBuilder(elite2ClientBuilder) {
  /**
   * @param {string} token
   * @param {string} agencyId
   * @returns {Promise<LocationFinder>}
   */
  const createLocationFinder = async (token, agencyId) => {
    const elite2Client = elite2ClientBuilder(token)

    const allLocations = await elite2Client.getLocations(agencyId, false)

    return locationId => {
      const match = allLocations.find(location => location.locationId === locationId)
      return match ? match.userDescription : 'Unknown'
    }
  }

  /**
   * @param {LocationFinder} locationFinder
   * @param {Incident[]} incidents
   * @returns {Map<String, Date[]>}
   */
  const getLocationToDates = (locationFinder, incidents) => {
    const incidentsWithDescription = incidents.map(incident => ({
      ...incident,
      location: locationFinder(incident.locationId),
    }))
    return incidentsWithDescription.reduce((result, i) => {
      const existingDates = result.get(i.location)
      const newDatesValue = existingDates ? [...existingDates, i.incidentDate] : [i.incidentDate]
      result.set(i.location, newDatesValue)
      return result
    }, new Map())
  }

  /**
   * @param {[string, Date[]]} entry
   * @returns {HeatmapRow}
   */
  const toHeatMapRow = ([location, dates]) => {
    const hours = dates.map(date => moment(date).hours())

    const count = test => hours.filter(test).length
    const hourCount = hourToMatch => count(hour => hour === hourToMatch)

    return {
      location,
      six: hourCount(6),
      seven: hourCount(7),
      eight: hourCount(8),
      nine: hourCount(9),
      ten: hourCount(10),
      eleven: hourCount(11),
      twelve: hourCount(12),
      onePm: hourCount(13),
      twoPm: hourCount(14),
      threePm: hourCount(15),
      fourPm: hourCount(16),
      fivePm: hourCount(17),
      sixPm: hourCount(18),
      sevenPm: hourCount(19),
      afterEight: count(hour => hour < 6 || hour >= 20),
      totalCount: hours.length,
    }
  }

  return {
    /**
     * @param {string} token
     * @param {string} agencyId
     * @param {Incident[]} incidents
     * @returns {Promise<Heatmap>}
     */
    async build(token, agencyId, incidents) {
      const locationFinder = await createLocationFinder(token, agencyId)
      const locationsToDates = getLocationToDates(locationFinder, incidents)
      const rows = Array.from(locationsToDates, toHeatMapRow).sort((rowA, rowB) => {
        const rowCompare = rowB.totalCount - rowA.totalCount
        if (rowCompare !== 0) {
          return rowCompare
        }
        return rowA.location.localeCompare(rowB.location)
      })
      return rows
    },
  }
}
