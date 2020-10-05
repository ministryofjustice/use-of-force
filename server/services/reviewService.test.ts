import IncidentClient from '../data/incidentClient'
import StatementsClient from '../data/statementsClient'
import ReviewService, { IncidentSummary, ReportQuery } from './reviewService'
import { ReportSummary } from '../data/incidentClientTypes'
import { PageResponse } from '../utils/page'
import OffenderService from './offenderService'
import { AuthClient, EmailResult } from '../data/authClientBuilder'

jest.mock('../data/incidentClient')
jest.mock('../data/statementsClient')
jest.mock('../data/authClientBuilder')
jest.mock('./offenderService')

const incidentClient = new IncidentClient(null, null) as jest.Mocked<IncidentClient>
const statementsClient = new StatementsClient(null) as jest.Mocked<StatementsClient>
const authClient = new AuthClient(null) as jest.Mocked<AuthClient>

const authClientBuilder = jest.fn().mockReturnValue(authClient)

const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>

let service: ReviewService

describe('reviewService', () => {
  beforeEach(() => {
    service = new ReviewService(
      statementsClient,
      incidentClient,
      authClientBuilder,
      offenderService,
      async username => `${username}-system-token`
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('getStatements', async () => {
    authClient.getEmail
      .mockResolvedValueOnce({ verified: false } as EmailResult)
      .mockResolvedValueOnce({ verified: true } as EmailResult)
    statementsClient.getStatementsForReviewer.mockResolvedValue([{ id: 1 }, { id: 2 }])

    const statements = await service.getStatements('token-1', 1)

    expect(statements).toEqual([
      { id: 1, isVerified: false },
      { id: 2, isVerified: true },
    ])
    expect(statementsClient.getStatementsForReviewer).toBeCalledWith(1)
  })

  describe('getStatement', () => {
    test('success', async () => {
      const date = new Date('2019-03-05 01:03:28')
      statementsClient.getStatementForReviewer.mockResolvedValue({ id: 2 })

      statementsClient.getAdditionalComments.mockResolvedValue([
        {
          additionalComment: 'comment1',
          dateSubmitted: date,
        },
      ])

      const output = await service.getStatement(1)

      expect(output).toEqual({
        id: 2,
        additionalComments: [
          {
            additionalComment: 'comment1',
            dateSubmitted: date,
          },
        ],
      })

      expect(statementsClient.getStatementForReviewer).toBeCalledWith(1)
    })

    test('failed as no statement', async () => {
      statementsClient.getStatementForReviewer.mockReturnValue(null)

      await expect(service.getStatement(1)).rejects.toThrow("Statement: '1' does not exist")
    })
  })

  describe('getReport', () => {
    test('it should call query on db', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({ id: 2 })
      await service.getReport(1)
      expect(incidentClient.getReportForReviewer).toBeCalledTimes(1)
      expect(incidentClient.getReportForReviewer).toBeCalledWith(1)
    })

    test('report not present', async () => {
      incidentClient.getReportForReviewer.mockReturnValue(null)

      await expect(service.getReport(1)).rejects.toThrow("Report: '1' does not exist")
    })
  })

  describe('getIncompletedReports', () => {
    const reportSummary = (id: number): ReportSummary => ({
      id,
      bookingId: id + 1,
      reporterName: `reporter-${id}`,
      offenderNo: `offender-${id}`,
      incidentDate: new Date(id),
    })

    const incidentSummary = (id: number): IncidentSummary => ({
      id,
      bookingId: id + 1,
      incidentdate: new Date(id),
      staffMemberName: `reporter-${id}`,
      isOverdue: false,
      offenderName: `Prisoner prisoner-${id}`,
      offenderNo: `offender-${id}`,
    })

    test('retrieve and include offender names', async () => {
      incidentClient.getIncompleteReportsForReviewer.mockResolvedValue([reportSummary(1), reportSummary(2)])

      offenderService.getOffenderNames.mockResolvedValue({
        'offender-1': 'Prisoner prisoner-1',
        'offender-2': 'Prisoner prisoner-2',
      })

      const result = await service.getIncompleteReports('userName', 'agency-1')
      expect(result).toEqual([incidentSummary(1), incidentSummary(2)])
      expect(incidentClient.getIncompleteReportsForReviewer).toBeCalledWith('agency-1')
      expect(offenderService.getOffenderNames).toBeCalledWith('userName-system-token', ['offender-1', 'offender-2'])
    })
  })

  describe('getCompletedReports', () => {
    const reportSummary = (id: number): ReportSummary => ({
      id,
      bookingId: id + 1,
      reporterName: `reporter-${id}`,
      offenderNo: `offender-${id}`,
      incidentDate: new Date(id),
    })

    const incidentSummary = (id: number): IncidentSummary => ({
      id,
      bookingId: id + 1,
      incidentdate: new Date(id),
      staffMemberName: `reporter-${id}`,
      isOverdue: false,
      offenderName: `Prisoner prisoner-${id}`,
      offenderNo: `offender-${id}`,
    })

    test('when not filtering on prisoner name', async () => {
      const query: ReportQuery = { prisonNumber: 'AA1234A' }

      incidentClient.getCompletedReportsForReviewer.mockResolvedValue(
        new PageResponse({ min: 1, max: 2, page: 1, totalCount: 2, totalPages: 1 }, [
          reportSummary(1),
          reportSummary(2),
        ])
      )
      offenderService.getOffenderNames.mockResolvedValue({
        'offender-1': 'Prisoner prisoner-1',
        'offender-2': 'Prisoner prisoner-2',
      })

      const result = await service.getCompletedReports('userName', 'agency-1', query, 1)
      expect(result).toEqual(
        new PageResponse({ min: 1, max: 2, page: 1, totalCount: 2, totalPages: 1 }, [
          incidentSummary(1),
          incidentSummary(2),
        ])
      )
      expect(incidentClient.getCompletedReportsForReviewer).toBeCalledWith('agency-1', query, 1)
      expect(offenderService.getOffenderNames).toBeCalledWith('userName-system-token', ['offender-1', 'offender-2'])
    })

    test('it can filter on prisoner name', async () => {
      const query = { prisonerName: 'OnER-2' }

      incidentClient.getAllCompletedReportsForReviewer.mockResolvedValue([reportSummary(1), reportSummary(2)])

      offenderService.getOffenderNames.mockResolvedValue({
        'offender-1': 'Prisoner prisoner-1',
        'offender-2': 'Prisoner prisoner-2',
      })

      const result = await service.getCompletedReports('userName', 'agency-1', query, 1)
      expect(result).toEqual(
        new PageResponse(
          { min: 1, max: 1, page: 1, totalCount: 1, totalPages: 1, nextPage: null, previousPage: null },
          [incidentSummary(2)]
        )
      )
      expect(incidentClient.getAllCompletedReportsForReviewer).toBeCalledWith('agency-1', query)
      expect(offenderService.getOffenderNames).toBeCalledWith('userName-system-token', ['offender-1', 'offender-2'])
    })
  })
})
