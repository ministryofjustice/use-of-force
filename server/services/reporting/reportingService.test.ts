import moment from 'moment'
import { ReportStatus } from '../../config/types'
import OffenderService from '../offenderService'
import { PrisonerDetail } from '../../data/prisonClientTypes'
import ReportingService from './reportingService'
import ReportingClient from '../../data/reportingClient'
import { OffenderNoWithIncidentCount } from '../../types/uof'

jest.mock('../offenderService')
jest.mock('../../data/reportingClient')

const reportingClient = new ReportingClient(null) as jest.Mocked<ReportingClient>

const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>

const heatmapBuilder = {
  build: jest.fn(),
}

let service

beforeEach(() => {
  service = new ReportingService(reportingClient, offenderService, heatmapBuilder)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('reportingService', () => {
  it('getMostOftenInvolvedStaff', async () => {
    reportingClient.getMostOftenInvolvedStaff.mockResolvedValue([
      { name: 'Arthur', count: 20 },
      { name: 'Bella', count: 10 },
      { name: 'Charlotte', count: 5 },
    ])

    const date = moment({ years: 2019, months: 1 })
    const startDate = moment(date).startOf('month')
    const endDate = moment(date).endOf('month')

    const result = await service.getMostOftenInvolvedStaff('LEI', 2, 2019)

    expect(result).toEqual(`Staff member name,Count
Arthur,20
Bella,10
Charlotte,5
`)

    expect(reportingClient.getMostOftenInvolvedStaff).toBeCalledWith('LEI', [startDate, endDate])
  })

  it('getMostOftenInvolvedPrisoners', async () => {
    offenderService.getOffenderNames.mockResolvedValue({
      AAAA: 'Arthur',
      BBBB: 'Bella',
      CCCC: 'Charlotte',
    })

    reportingClient.getMostOftenInvolvedPrisoners.mockResolvedValue([
      { offenderNo: 'AAAA', count: 20 },
      { offenderNo: 'BBBB', count: 10 },
      { offenderNo: 'CCCC', count: 5 },
    ])

    const date = moment({ years: 2019, months: 1 })
    const startDate = moment(date).startOf('month')
    const endDate = moment(date).endOf('month')

    const result = await service.getMostOftenInvolvedPrisoners('token-1', 'LEI', 2, 2019)

    expect(result).toEqual(`Prisoner name,Count
Arthur,20
Bella,10
Charlotte,5
`)

    expect(reportingClient.getMostOftenInvolvedPrisoners).toBeCalledWith('LEI', [startDate, endDate])
    expect(offenderService.getOffenderNames).toBeCalledWith('token-1', ['AAAA', 'BBBB', 'CCCC'])
  })

  it('getIncidentsOverview', async () => {
    reportingClient.getIncidentsOverview
      .mockResolvedValueOnce([
        {
          total: 1,
          planned: 2,
          unplanned: 3,
          handcuffsApplied: 4,
          batonDrawn: 5,
          batonUsed: 6,
          pavaDrawn: 7,
          pavaUsed: 8,
          personalProtectionTechniques: 9,
          cctvRecording: 10,
          bodyWornCamera: 11,
          bodyWornCameraUnknown: 12,
        },
      ])
      .mockResolvedValueOnce([
        {
          total: 11,
          planned: 22,
          unplanned: 33,
          handcuffsApplied: 44,
          batonDrawn: 55,
          batonUsed: 66,
          pavaDrawn: 77,
          pavaUsed: 88,
          personalProtectionTechniques: 99,
          cctvRecording: 100,
          bodyWornCamera: 110,
          bodyWornCameraUnknown: 120,
        },
      ])

    const date = moment({ years: 2019, months: 1 })
    const startDate = moment(date).startOf('month')
    const endDate = moment(date).endOf('month')

    const result = await service.getIncidentsOverview('LEI', 2, 2019)

    expect(result)
      .toEqual(`Type,Total,Planned incidents,Unplanned incidents,Handcuffs applied,Baton drawn,Baton used,Pava drawn,Pava used,Personal protection techniques,CCTV recording,Body worn camera recording,Body worn camera recording unknown
Complete,1,2,3,4,5,6,7,8,9,10,11,12
In progress,11,22,33,44,55,66,77,88,99,100,110,120
`)

    expect(reportingClient.getIncidentsOverview).toBeCalledWith(
      'LEI',
      [startDate, endDate],
      [ReportStatus.SUBMITTED, ReportStatus.COMPLETE]
    )
    expect(reportingClient.getIncidentsOverview).toBeCalledWith('LEI', [startDate, endDate], [ReportStatus.IN_PROGRESS])
  })

  test('getIncidentHeatmap', async () => {
    reportingClient.getIncidentLocationsAndTimes.mockResolvedValue([{ locationId: 1, incidentDate: new Date(0) }])
    heatmapBuilder.build.mockReturnValue([
      {
        location: 'The kitchen',
        six: 1,
        seven: 2,
        eight: 3,
        nine: 4,
        ten: 5,
        eleven: 6,
        twelve: 7,
        onePm: 8,
        twoPm: 9,
        threePm: 10,
        fourPm: 11,
        fivePm: 12,
        sixPm: 13,
        sevenPm: 14,
        afterEight: 15,
      },
      {
        location: 'The bathroom',
        six: 10,
        seven: 20,
        eight: 30,
        nine: 40,
        ten: 50,
        eleven: 60,
        twelve: 70,
        onePm: 80,
        twoPm: 90,
        threePm: 100,
        fourPm: 110,
        fivePm: 120,
        sixPm: 130,
        sevenPm: 140,
        afterEight: 150,
      },
    ])

    const date = moment({ years: 2019, months: 1 })
    const startDate = moment(date).startOf('month')
    const endDate = moment(date).endOf('month')

    const result = await service.getIncidentHeatmap('token-1', 'LEI', 2, 2019)

    expect(result)
      .toEqual(`Location,06:00,07:00,08:00,09:00,10:00,11:00,12:00,13:00,14:00,15:00,16:00,17:00,18:00,19:00,20:00+
The kitchen,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15
The bathroom,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150
`)

    expect(reportingClient.getIncidentLocationsAndTimes).toBeCalledWith('LEI', [startDate, endDate])
    expect(heatmapBuilder.build).toBeCalledWith('token-1', 'LEI', [
      {
        locationId: 1,
        incidentDate: new Date(0),
      },
    ])
  })

  test('getIncidentsByReligiousGroup', async () => {
    reportingClient.getIncidentCountByOffenderNo.mockResolvedValue([
      { offenderNo: 'A1', incidentCount: 2 },
      { offenderNo: 'A2', incidentCount: 1 },
      { offenderNo: 'A3', incidentCount: 2 },
    ] as OffenderNoWithIncidentCount[])

    offenderService.getPrisonersDetails.mockResolvedValue(
      Promise.resolve([
        { offenderNo: 'A1', religionCode: 'CE' },
        { offenderNo: 'A2', religionCode: 'SHIA' },
        { offenderNo: 'A3', religionCode: 'CE' },
      ] as PrisonerDetail[])
    )

    const result = await service.getIncidentsByReligiousGroup('token-1', 'LEI', 2, 2019)

    expect(result).toEqual(
      `Buddhist,Christian,Hindu,Jewish,Muslim,No religion,Not recognised / not recorded,Other,Sikh
0,4,0,0,1,0,0,0,0
`
    )
  })

  test('getIncidentsByEthnicGroup', async () => {
    reportingClient.getIncidentCountByOffenderNo.mockResolvedValue([
      { offenderNo: 'A1', incidentCount: 2 },
      { offenderNo: 'A2', incidentCount: 1 },
      { offenderNo: 'A3', incidentCount: 2 },
    ])

    offenderService.getPrisonersDetails.mockResolvedValue([
      { offenderNo: 'A1', ethnicityCode: 'W1' },
      { offenderNo: 'A2', ethnicityCode: 'A2' },
      { offenderNo: 'A3', ethnicityCode: 'NS' },
    ] as PrisonerDetail[])

    const result = await service.getIncidentsByEthnicGroup('token-1', 'LEI', 2, 2019)

    expect(result).toEqual(
      `White,Asian or Asian British,Black or Black British,Mixed Ethnic Groups,Other Ethnic Group,Not known
2,1,0,0,0,2
`
    )
  })

  test('getIncidentsByAgeGroup', async () => {
    reportingClient.getIncidentsForAgencyAndDateRange.mockResolvedValue([
      { offenderNo: 'A1', incidentDate: moment({ year: 2019, month: 1, day: 1 }).toDate() },
      { offenderNo: 'A2', incidentDate: moment({ year: 2019, month: 1, day: 1 }).toDate() },
      { offenderNo: 'A3', incidentDate: moment({ year: 2019, month: 1, day: 1 }).toDate() },
    ])

    offenderService.getPrisonersDetails.mockResolvedValue([
      { offenderNo: 'A1', dateOfBirth: '1980-02-25' },
      { offenderNo: 'A2', dateOfBirth: '1981-02-25' },
      { offenderNo: 'A3', dateOfBirth: '1970-02-25' },
    ] as PrisonerDetail[])

    const result = await service.getIncidentsByAgeGroup('token-1', 'LEI', 2, 2019)

    expect(result).toEqual(
      '18 - 20,21 - 24,25 - 29,30 - 39,40 - 49,50 - 59,60 - 69,70 - 79,80+,Unknown\n0,0,0,2,1,0,0,0,0,0\n'
    )

    const startDate = moment({ year: 2019, month: 1, day: 1 })
    const endDate = moment({ year: 2019, month: 1, day: 28, hour: 23, minute: 59, seconds: 59, milliseconds: 999 })

    const mockCalls = reportingClient.getIncidentsForAgencyAndDateRange.mock.calls

    expect(mockCalls.length).toBe(1)
    expect(mockCalls[0][0]).toEqual('LEI')

    const actualDates = mockCalls[0][1]
    expect(actualDates[0].isSame(startDate)).toBeTruthy()
    expect(actualDates[1].isSame(endDate)).toBeTruthy()
  })

  it('compares moments', () => {
    const d1 = moment({ years: 2019, months: 1, days: 1 })
    const d2 = moment({ years: 2019, months: 1, days: 28, hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
    expect([d1, d2]).toEqual([d1.clone(), d2.clone()])
  })
})
