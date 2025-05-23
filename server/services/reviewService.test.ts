import { IncidentClient, StatementsClient, AuthClient, RestClientBuilder } from '../data'
import ReviewService, { IncidentSummary, ReportQuery } from './reviewService'
import { Report, ReportSummary } from '../data/incidentClientTypes'
import { PageResponse } from '../utils/page'
import OffenderService from './offenderService'
import { EmailResult } from '../data/authClient'
import { ReviewerStatement } from '../data/statementsClientTypes'

jest.mock('../data')
jest.mock('./offenderService')

const incidentClient = new IncidentClient(null, null, null) as jest.Mocked<IncidentClient>
const statementsClient = new StatementsClient(null) as jest.Mocked<StatementsClient>
const authClient = new AuthClient(null) as jest.Mocked<AuthClient>
const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>

let service: ReviewService
let authClientBuilder: RestClientBuilder<AuthClient>

describe('reviewService', () => {
  beforeEach(() => {
    authClientBuilder = jest.fn().mockReturnValue(authClient)

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
    statementsClient.getStatementsForReviewer.mockResolvedValue([{ id: 1 }, { id: 2 }] as ReviewerStatement[])

    const statements = await service.getStatements('token-1', 1)

    expect(statements).toEqual([
      { id: 1, isVerified: false },
      { id: 2, isVerified: true },
    ])
    expect(statementsClient.getStatementsForReviewer).toHaveBeenCalledWith(1)
  })

  describe('getStatement', () => {
    test('success', async () => {
      const date = new Date('2019-03-05 01:03:28')
      statementsClient.getStatementForReviewer.mockResolvedValue({ userId: 'USER_1', id: 2 } as ReviewerStatement)
      authClient.getEmail.mockResolvedValue({ verified: true } as EmailResult)
      statementsClient.getAdditionalComments.mockResolvedValue([
        {
          additionalComment: 'comment1',
          dateSubmitted: date,
        },
      ])

      const output = await service.getStatement('token-1', 1)

      expect(output).toEqual({
        id: 2,
        userId: 'USER_1',
        isVerified: true,
        additionalComments: [
          {
            additionalComment: 'comment1',
            dateSubmitted: date,
          },
        ],
      })

      expect(authClientBuilder).toHaveBeenCalledWith('token-1')
      expect(authClient.getEmail).toHaveBeenCalledWith('USER_1')
      expect(statementsClient.getStatementForReviewer).toHaveBeenCalledWith(1)
    })

    test('failed as no statement', async () => {
      statementsClient.getStatementForReviewer.mockReturnValue(null)

      await expect(service.getStatement('token-1', 1)).rejects.toThrow("Statement: '1' does not exist")
    })
  })

  describe('getReport', () => {
    test('it should call query on db', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({ id: 2 } as Report)
      await service.getReport(1)
      expect(incidentClient.getReportForReviewer).toHaveBeenCalledTimes(1)
      expect(incidentClient.getReportForReviewer).toHaveBeenCalledWith(1)
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
      isRemovalRequested: false,
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
      expect(incidentClient.getIncompleteReportsForReviewer).toHaveBeenCalledWith('agency-1')
      expect(offenderService.getOffenderNames).toHaveBeenCalledWith('userName-system-token', [
        'offender-1',
        'offender-2',
      ])
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
      isRemovalRequested: false,
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
      expect(incidentClient.getCompletedReportsForReviewer).toHaveBeenCalledWith('agency-1', query, 1)
      expect(offenderService.getOffenderNames).toHaveBeenCalledWith('userName-system-token', [
        'offender-1',
        'offender-2',
      ])
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
      expect(incidentClient.getAllCompletedReportsForReviewer).toHaveBeenCalledWith('agency-1', query)
      expect(offenderService.getOffenderNames).toHaveBeenCalledWith('userName-system-token', [
        'offender-1',
        'offender-2',
      ])
    })

    test('escapes regex characters when filtering by prisoner name', async () => {
      const query = { prisonerName: 'b.a[?d' }

      incidentClient.getAllCompletedReportsForReviewer.mockResolvedValue([reportSummary(1), reportSummary(2)])

      offenderService.getOffenderNames.mockResolvedValue({
        'offender-1': 'Prisoner prisoner-1',
        'offender-2': 'Prisoner prisoner-2',
      })

      const result = await service.getCompletedReports('userName', 'agency-1', query, 1)
      expect(result).toEqual(new PageResponse({ min: 0, max: 0, page: 1, totalCount: 0, totalPages: 0 }, []))
    })
  })
})
