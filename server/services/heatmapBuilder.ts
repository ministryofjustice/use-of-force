import moment from 'moment'

type Incident = {
  incidentDate: Date
  locationId: number
}

type HeatmapRow = {
  location: string
  six: number // (06:00 -> 06:59)
  seven: number
  eight: number
  nine: number
  ten: number
  eleven: number
  twelve: number
  onePm: number
  twoPm: number
  threePm: number
  fourPm: number
  fivePm: number
  sixPm: number
  sevenPm: number // (19:00 -> 19:59)
  afterEight: number
  totalCount: number
}

type Heatmap = HeatmapRow[]

type LocationFinder = (locationId: number) => string

export type HeatmapBuilder = {
  build: (token: string, agencyId: string, incidents: Incident[]) => Promise<Heatmap>
}

export default function createHeatmapBuilder(elite2ClientBuilder: any): HeatmapBuilder {
  const createLocationFinder = async (token: string, agencyId: string): Promise<LocationFinder> => {
    const elite2Client = elite2ClientBuilder(token)

    const allLocations = await elite2Client.getLocations(agencyId, false)

    return (locationId): string => {
      const match = allLocations.find(location => location.locationId === locationId)
      return match ? match.userDescription : 'Unknown'
    }
  }

  const getLocationToDates = (locationFinder: LocationFinder, incidents: Incident[]): Map<string, Date[]> => {
    const incidentsWithDescription = incidents.map(incident => ({
      ...incident,
      location: locationFinder(incident.locationId),
    }))
    return incidentsWithDescription.reduce((result, i) => {
      const existingDates = result.get(i.location)
      const newDatesValue = existingDates ? [...existingDates, i.incidentDate] : [i.incidentDate]
      result.set(i.location, newDatesValue)
      return result
    }, new Map<string, Date[]>())
  }

  const toHeatMapRow = ([location, dates]: [string, Date[]]): HeatmapRow => {
    const hours = dates.map(date => moment(date).hours())

    const count = (test): number => hours.filter(test).length
    const hourCount = (hourToMatch): number => count(hour => hour === hourToMatch)

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
    async build(token: string, agencyId: string, incidents: Incident[]): Promise<Heatmap> {
      const locationFinder = await createLocationFinder(token, agencyId)
      const locationsToDates = getLocationToDates(locationFinder, incidents)
      const rows = Array.from(locationsToDates, toHeatMapRow).sort((rowA: HeatmapRow, rowB: HeatmapRow) => {
        const rowCompare = rowB.totalCount - rowA.totalCount
        if (rowCompare !== 0) {
          return rowCompare
        }
        return rowA.location.localeCompare(rowB.location)
      })
      return rows
    },
  } as HeatmapBuilder
}
