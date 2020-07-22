/* eslint-disable import/first */
import { OffenderService } from '../types/uof'

jest.mock('../data/incidentClient')

import IncidentClient from '../data/incidentClient'
import ReviewService, { IncidentSummary } from './reviewService'
import { ReportSummary } from '../data/incidentClientTypes'

let incidentClient: jest.Mocked<IncidentClient>

const statementsClient = {
  getStatementsForReviewer: jest.fn(),
  getStatementForReviewer: jest.fn(),
  getAdditionalComments: jest.fn(),
}

const authClient = {
  getEmail: jest.fn(),
}

const authClientBuilder = jest.fn().mockReturnValue(authClient)

interface MockOS extends OffenderService {
  getOffenderNames: jest.Mock<Promise<{ [offenderNo: string]: string }>, [string, string[]]>
}
const offenderService: MockOS = {
  getOffenderDetails: undefined,
  getOffenderNames: jest.fn(),
  getPrisonersDetails: undefined,
  getOffenderImage: undefined,
}

let service: ReviewService

describe('reviewService', () => {
  beforeEach(() => {
    incidentClient = new IncidentClient(jest.fn(), jest.fn()) as jest.Mocked<IncidentClient>
    service = new ReviewService(statementsClient, incidentClient, authClientBuilder, offenderService, username =>
      Promise.resolve(`${username}-system-token`)
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('getStatements', async () => {
    authClient.getEmail.mockResolvedValueOnce({ verified: false }).mockResolvedValueOnce({ verified: true })
    statementsClient.getStatementsForReviewer.mockReturnValue([{ id: 1 }, { id: 2 }])

    const statements = await service.getStatements('token-1', 'report-1')

    expect(statements).toEqual([
      { id: 1, isVerified: false },
      { id: 2, isVerified: true },
    ])
    expect(statementsClient.getStatementsForReviewer).toBeCalledWith('report-1')
  })

  describe('getStatement', () => {
    test('success', async () => {
      statementsClient.getStatementForReviewer.mockReturnValue({ id: 2 })

      statementsClient.getAdditionalComments.mockReturnValue([
        {
          id: 1,
          statementId: 1,
          additionalComment: 'comment1',
          dataSubmitted: '2019-03-05 01:03:28',
        },
      ])

      const output = await service.getStatement('statement-1')

      expect(output).toEqual({
        id: 2,
        additionalComments: [
          {
            id: 1,
            statementId: 1,
            additionalComment: 'comment1',
            dataSubmitted: '2019-03-05 01:03:28',
          },
        ],
      })

      expect(statementsClient.getStatementForReviewer).toBeCalledWith('statement-1')
    })

    test('failed as no statement', async () => {
      statementsClient.getStatementForReviewer.mockReturnValue(null)

      await expect(service.getStatement('statement-1')).rejects.toThrow("Statement: 'statement-1' does not exist")
    })
  })

  describe('getReport', () => {
    test('it should call query on db', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({ id: 2 })
      await service.getReport('report1')
      expect(incidentClient.getReportForReviewer).toBeCalledTimes(1)
      expect(incidentClient.getReportForReviewer).toBeCalledWith('report1')
    })

    test('report not present', async () => {
      incidentClient.getReportForReviewer.mockReturnValue(null)

      await expect(service.getReport('report1')).rejects.toThrow("Report: 'report1' does not exist")
    })
  })

  describe('getReports', () => {
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

    test('it should call query on db', async () => {
      const query = { prisonNumber: 'AA' }

      incidentClient.getIncompleteReportsForReviewer.mockResolvedValue([reportSummary(1)])
      incidentClient.getCompletedReportsForReviewer.mockResolvedValue([reportSummary(2)])
      offenderService.getOffenderNames.mockResolvedValue(
        Promise.resolve({
          'offender-1': 'Prisoner prisoner-1',
          'offender-2': 'Prisoner prisoner-2',
        })
      )

      const result = await service.getReports('userName', 'agency-1', query)
      expect(result).toEqual({ awaitingReports: [incidentSummary(1)], completedReports: [incidentSummary(2)] })

      expect(incidentClient.getIncompleteReportsForReviewer).toBeCalledWith('agency-1', query)
      expect(incidentClient.getCompletedReportsForReviewer).toBeCalledWith('agency-1', query)
      expect(offenderService.getOffenderNames).toBeCalledWith('userName-system-token', ['offender-1', 'offender-2'])
    })

    test('it should filter on prisoner name', async () => {
      const query = { prisonerName: 'OnER-2' }

      incidentClient.getIncompleteReportsForReviewer.mockResolvedValue([reportSummary(1)])
      incidentClient.getCompletedReportsForReviewer.mockResolvedValue([reportSummary(2)])
      offenderService.getOffenderNames.mockResolvedValue({
        'offender-1': 'Prisoner prisoner-1',
        'offender-2': 'Prisoner prisoner-2',
      })

      const result = await service.getReports('userName', 'agency-1', query)
      expect(result).toEqual({ awaitingReports: [], completedReports: [incidentSummary(2)] })

      expect(incidentClient.getIncompleteReportsForReviewer).toBeCalledWith('agency-1', query)
      expect(incidentClient.getCompletedReportsForReviewer).toBeCalledWith('agency-1', query)
      expect(offenderService.getOffenderNames).toBeCalledWith('userName-system-token', ['offender-1', 'offender-2'])
    })
  })
})
