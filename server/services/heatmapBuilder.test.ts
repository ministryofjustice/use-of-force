import moment from 'moment'
import createHeatmapBuilder from './heatmapBuilder'

const location1 = { locationId: 1, userDescription: 'The kitchen' }
const location2 = { locationId: 2, userDescription: 'The bathroom' }
const location3 = { locationId: 3, userDescription: 'The garden' }

const elite2Client = {
  getLocations: jest.fn(),
}

const elite2ClientBuilder = jest.fn()

let builder

beforeEach(() => {
  elite2ClientBuilder.mockReturnValue(elite2Client)
  elite2Client.getLocations.mockResolvedValue([location1, location2, location3])
  builder = createHeatmapBuilder(elite2ClientBuilder)
})

afterEach(() => {
  jest.resetAllMocks()
})

const date = text => moment(text).toDate()

describe('builder', () => {
  describe('build', () => {
    test('getLocations called with correct args', async () => {
      await builder.build('token-1', 'agency-1', [])

      expect(elite2ClientBuilder).toBeCalledWith('token-1')
      expect(elite2Client.getLocations).toBeCalledWith('agency-1', false)
    })

    test('with no incidents', async () => {
      const result = await builder.build('token-1', 'agency-1', [])
      expect(result).toStrictEqual([])
    })

    test('with a single incident', async () => {
      const result = await builder.build('token-1', 'agency-1', [
        { incidentDate: date('2020-01-02 09:00:00'), locationId: 1 },
      ])
      expect(result).toStrictEqual([
        {
          location: 'The kitchen',
          six: 0,
          seven: 0,
          eight: 0,
          nine: 1,
          ten: 0,
          eleven: 0,
          twelve: 0,
          onePm: 0,
          twoPm: 0,
          threePm: 0,
          fourPm: 0,
          fivePm: 0,
          sixPm: 0,
          sevenPm: 0,
          afterEight: 0,
          totalCount: 1,
        },
      ])
    })

    test('with a single incident in an unknown location', async () => {
      const result = await builder.build('token-1', 'agency-1', [
        { incidentDate: date('2020-01-02 09:00:00'), locationId: 999 },
      ])
      expect(result).toStrictEqual([
        {
          location: 'Unknown',
          six: 0,
          seven: 0,
          eight: 0,
          nine: 1,
          ten: 0,
          eleven: 0,
          twelve: 0,
          onePm: 0,
          twoPm: 0,
          threePm: 0,
          fourPm: 0,
          fivePm: 0,
          sixPm: 0,
          sevenPm: 0,
          afterEight: 0,
          totalCount: 1,
        },
      ])
    })

    test('with a multiple incidents in same location', async () => {
      const result = await builder.build('token-1', 'agency-1', [
        { incidentDate: date('2020-01-02 08:59:50'), locationId: 1 },
        { incidentDate: date('2020-01-02 09:00:00'), locationId: 1 },
        { incidentDate: date('2020-01-02 09:00:01'), locationId: 1 },
        { incidentDate: date('2020-01-02 09:59:59'), locationId: 1 },
        { incidentDate: date('2020-01-02 10:00:00'), locationId: 1 },
      ])
      expect(result).toStrictEqual([
        {
          location: 'The kitchen',
          six: 0,
          seven: 0,
          eight: 1,
          nine: 3,
          ten: 1,
          eleven: 0,
          twelve: 0,
          onePm: 0,
          twoPm: 0,
          threePm: 0,
          fourPm: 0,
          fivePm: 0,
          sixPm: 0,
          sevenPm: 0,
          afterEight: 0,
          totalCount: 5,
        },
      ])
    })

    test('with a multiple incidents in different locations ordered by quantity', async () => {
      const result = await builder.build('token-1', 'agency-1', [
        { incidentDate: date('2020-01-02 08:59:50'), locationId: 1 },
        { incidentDate: date('2020-01-02 09:00:00'), locationId: 2 },
        { incidentDate: date('2020-01-02 09:00:00'), locationId: 3 },
        { incidentDate: date('2020-01-02 09:00:01'), locationId: 1 },
        { incidentDate: date('2020-01-02 09:59:59'), locationId: 1 },
        { incidentDate: date('2020-01-02 10:00:00'), locationId: 2 },
      ])
      expect(result).toStrictEqual([
        {
          location: 'The kitchen',
          six: 0,
          seven: 0,
          eight: 1,
          nine: 2,
          ten: 0,
          eleven: 0,
          twelve: 0,
          onePm: 0,
          twoPm: 0,
          threePm: 0,
          fourPm: 0,
          fivePm: 0,
          sixPm: 0,
          sevenPm: 0,
          afterEight: 0,
          totalCount: 3,
        },
        {
          location: 'The bathroom',
          six: 0,
          seven: 0,
          eight: 0,
          nine: 1,
          ten: 1,
          eleven: 0,
          twelve: 0,
          onePm: 0,
          twoPm: 0,
          threePm: 0,
          fourPm: 0,
          fivePm: 0,
          sixPm: 0,
          sevenPm: 0,
          afterEight: 0,
          totalCount: 2,
        },
        {
          location: 'The garden',
          six: 0,
          seven: 0,
          eight: 0,
          nine: 1,
          ten: 0,
          eleven: 0,
          twelve: 0,
          onePm: 0,
          twoPm: 0,
          threePm: 0,
          fourPm: 0,
          fivePm: 0,
          sixPm: 0,
          sevenPm: 0,
          afterEight: 0,
          totalCount: 1,
        },
      ])
    })

    test('with a multiple incidents in different locations, ties ordered by location', async () => {
      const result = await builder.build('token-1', 'agency-1', [
        { incidentDate: date('2020-01-02 09:00:00'), locationId: 1 },
        { incidentDate: date('2020-01-02 09:00:00'), locationId: 1 },
        { incidentDate: date('2020-01-02 09:00:00'), locationId: 2 },
        { incidentDate: date('2020-01-02 09:00:00'), locationId: 2 },
        { incidentDate: date('2020-01-02 09:00:00'), locationId: 3 },
        { incidentDate: date('2020-01-02 09:00:00'), locationId: 3 },
      ])
      expect(result).toStrictEqual([
        {
          location: 'The bathroom',
          six: 0,
          seven: 0,
          eight: 0,
          nine: 2,
          ten: 0,
          eleven: 0,
          twelve: 0,
          onePm: 0,
          twoPm: 0,
          threePm: 0,
          fourPm: 0,
          fivePm: 0,
          sixPm: 0,
          sevenPm: 0,
          afterEight: 0,
          totalCount: 2,
        },
        {
          location: 'The garden',
          six: 0,
          seven: 0,
          eight: 0,
          nine: 2,
          ten: 0,
          eleven: 0,
          twelve: 0,
          onePm: 0,
          twoPm: 0,
          threePm: 0,
          fourPm: 0,
          fivePm: 0,
          sixPm: 0,
          sevenPm: 0,
          afterEight: 0,
          totalCount: 2,
        },
        {
          location: 'The kitchen',
          six: 0,
          seven: 0,
          eight: 0,
          nine: 2,
          ten: 0,
          eleven: 0,
          twelve: 0,
          onePm: 0,
          twoPm: 0,
          threePm: 0,
          fourPm: 0,
          fivePm: 0,
          sixPm: 0,
          sevenPm: 0,
          afterEight: 0,
          totalCount: 2,
        },
      ])
    })
  })

  describe('times to buckets', () => {
    test.each([
      ['00:00:00', 'afterEight'],
      ['05:59:00', 'afterEight'],
      ['06:00:00', 'six'],
      ['07:00:00', 'seven'],
      ['08:00:00', 'eight'],
      ['09:00:00', 'nine'],
      ['10:00:00', 'ten'],
      ['11:00:00', 'eleven'],
      ['12:00:00', 'twelve'],
      ['13:00:00', 'onePm'],
      ['14:00:00', 'twoPm'],
      ['15:00:00', 'threePm'],
      ['16:00:00', 'fourPm'],
      ['17:00:00', 'fivePm'],
      ['18:00:00', 'sixPm'],
      ['19:00:00', 'sevenPm'],
      ['20:00:00', 'afterEight'],
      ['21:00:00', 'afterEight'],
      ['22:00:00', 'afterEight'],
      ['23:00:00', 'afterEight'],
      ['23:59:59', 'afterEight'],
    ])('time: "%s" to be classified as "%s")', async (time, expectedBucket) => {
      const [row] = await builder.build('token-1', 'agency-1', [
        { incidentDate: date(`2020-01-02 ${time}`), locationId: 1 },
      ])
      expect(row).toStrictEqual({
        location: 'The kitchen',
        six: 0,
        seven: 0,
        eight: 0,
        nine: 0,
        ten: 0,
        eleven: 0,
        twelve: 0,
        onePm: 0,
        twoPm: 0,
        threePm: 0,
        fourPm: 0,
        fivePm: 0,
        sixPm: 0,
        sevenPm: 0,
        afterEight: 0,
        totalCount: 1,
        [expectedBucket]: 1,
      })
    })
  })
})
