const moment = require('moment')
const serviceCreator = require('./reportingService')
const { ReportStatus } = require('../config/types')

const reportingClient = {
  getMostOftenInvolvedStaff: jest.fn(),
  getMostOftenInvolvedPrisoners: jest.fn(),
  getIncidentsOverview: jest.fn(),
}

const offenderService = {
  getOffenderNames: jest.fn(),
}

let service

beforeEach(() => {
  service = serviceCreator({ reportingClient, offenderService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('reportingService', () => {
  it('getMostOftenInvolvedStaff', async () => {
    reportingClient.getMostOftenInvolvedStaff.mockReturnValue([
      { userId: 'AAAA', name: 'Arthur', count: 20 },
      { userId: 'BBBB', name: 'Bella', count: 10 },
      { userId: 'CCCC', name: 'Charlotte', count: 5 },
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
    offenderService.getOffenderNames.mockReturnValue({
      AAAA: 'Arthur',
      BBBB: 'Bella',
      CCCC: 'Charlotte',
    })

    reportingClient.getMostOftenInvolvedPrisoners.mockReturnValue([
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
      .mockReturnValueOnce([
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
      .mockReturnValueOnce([
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
})
