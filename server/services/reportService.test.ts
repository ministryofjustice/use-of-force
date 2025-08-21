import IncidentClient from '../data/incidentClient'
import ReportService from './reportService'
import OffenderService from './offenderService'
import LocationService from './locationService'
import { PageResponse } from '../utils/page'
import { Report, ReportEdit } from '../data/incidentClientTypes'
import { Prison } from '../data/prisonClientTypes'
import { LoggedInUser } from '../types/uof'
import ReportLogClient from '../data/reportLogClient'
import AuthService from './authService'

jest.mock('../data/incidentClient')
jest.mock('../data/reportLogClient')
jest.mock('./offenderService')
jest.mock('./involvedStaffService')
jest.mock('./locationService')
jest.mock('./authService')

const incidentClient = new IncidentClient(null, null, null) as jest.Mocked<IncidentClient>

const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>
const locationService = new LocationService(null, null) as jest.Mocked<LocationService>
const reportLogClient = new ReportLogClient() as jest.Mocked<ReportLogClient>
const authService = new AuthService(null) as jest.Mocked<AuthService>

const transactionalClient = jest.fn()
const inTransaction = callback => callback(transactionalClient)
reportLogClient.insert = jest.fn()
let service: ReportService

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue('system-token-1')
  service = new ReportService(
    incidentClient,
    offenderService,
    locationService,
    reportLogClient,
    inTransaction,
    authService
  )
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('reportService', () => {
  describe('getReport', () => {
    test('it should call query on db', async () => {
      incidentClient.getReport.mockResolvedValue({} as Report)
      await service.getReport('user1', 1)
      expect(incidentClient.getReport).toHaveBeenCalledTimes(1)
      expect(incidentClient.getReport).toHaveBeenCalledWith('user1', 1)
    })

    test('it should throw an error if report doesnt exist', async () => {
      await expect(service.getReport('user1', 1)).rejects.toThrow('Report does not exist: 1')
    })
  })

  describe('getReportEdits', () => {
    test('it should call query on db', async () => {
      incidentClient.getReportEdits.mockResolvedValue([{}] as ReportEdit[])
      await service.getReportEdits(1)
      expect(incidentClient.getReportEdits).toHaveBeenCalledTimes(1)
      expect(incidentClient.getReportEdits).toHaveBeenCalledWith(1)
    })
  })
  describe('getAnonReportSummary', () => {
    test('it should call query on db', async () => {
      const report = { statementId: 1, incidentDate: new Date(1), agencyId: 'MDI', isRemovalRequested: true }
      locationService.getPrisonById.mockResolvedValue({ description: 'Moorland HMP' } as Prison)
      incidentClient.getAnonReportSummary.mockResolvedValue(report)

      await expect(service.getAnonReportSummary('token-1', 1)).resolves.toStrictEqual({
        statementId: 1,
        incidentDate: new Date(1),
        agencyId: 'MDI',
        prisonName: 'Moorland HMP',
        isRemovalRequested: true,
      })
      expect(locationService.getPrisonById).toHaveBeenCalledWith('token-1', 'MDI')
      expect(incidentClient.getAnonReportSummary).toHaveBeenCalledWith(1)
    })

    test('should handle when report doesnt exist', async () => {
      incidentClient.getAnonReportSummary.mockResolvedValue(undefined)

      await expect(service.getAnonReportSummary('token-1', 1)).resolves.toStrictEqual(undefined)
      expect(locationService.getPrisonById).not.toBeCalled()
      expect(incidentClient.getAnonReportSummary).toHaveBeenCalledWith(1)
    })
  })

  describe('getReports', () => {
    test('it should call query on db', async () => {
      offenderService.getOffenderNames.mockResolvedValue({ AA1234A: 'James Stuart' })
      const metaData = { min: 1, max: 1, page: 1, totalCount: 1, totalPages: 1 }
      incidentClient.getReports.mockResolvedValue(
        new PageResponse(metaData, [
          {
            id: 1,
            bookingId: 2,
            incidentDate: new Date(1),
            offenderNo: 'AA1234A',
            reporterName: 'BOB',
            status: 'IN_PROGRESS',
          },
        ])
      )
      const result = await service.getReports('user1', 1)
      expect(result).toEqual(
        new PageResponse(metaData, [
          {
            bookingId: 2,
            id: 1,
            incidentdate: new Date(1),
            offenderName: 'James Stuart',
            offenderNo: 'AA1234A',
            staffMemberName: 'BOB',
            status: 'IN_PROGRESS',
          },
        ])
      )
      expect(incidentClient.getReports).toHaveBeenCalledWith('user1', 1)
    })
  })

  describe('deleteReport', () => {
    test('when report exists', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({} as Report)

      await service.deleteReport('currentUser', 1)

      expect(incidentClient.deleteReport).toHaveBeenCalledWith('currentUser', 1)
    })

    test('when report does not exists', async () => {
      incidentClient.getReportForReviewer.mockReturnValue(null)

      await expect(service.deleteReport('currentUser', 1)).rejects.toThrow(`Report: '1' does not exist`)

      expect(incidentClient.deleteReport).not.toHaveBeenCalled()
    })

    describe('update', () => {
      test('can update form body when a change has occurred', async () => {
        incidentClient.getReportForReviewer.mockResolvedValue({
          id: 1,
          form: { evidence: { baggedEvidence: false } },
        } as Report)

        await service.update({ username: 'USER-1', token: 'token-1' } as LoggedInUser, 12, 'evidence', {
          baggedEvidence: true,
        })

        expect(incidentClient.update).toHaveBeenCalledWith(
          1,
          undefined,
          { evidence: { baggedEvidence: true } },
          transactionalClient
        )
      })

      test('does not update when no change has occurred', async () => {
        incidentClient.getReportForReviewer.mockResolvedValue({
          id: 1,
          form: { evidence: { baggedEvidence: true } },
        } as Report)

        await service.update({ username: 'USER-1', token: 'token-1' } as LoggedInUser, 12, 'evidence', {
          baggedEvidence: true,
        })

        expect(incidentClient.update).not.toHaveBeenCalled()
      })

      test('can update incident date when provided', async () => {
        const incidentDate = new Date()
        incidentClient.getReportForReviewer.mockResolvedValue({
          id: 1,
          form: { evidence: { baggedEvidence: true } },
        } as Report)

        await service.update(
          { username: 'USER-1', token: 'token-1' } as LoggedInUser,
          12,
          'evidence',
          {
            baggedEvidence: true,
          },
          incidentDate
        )

        expect(incidentClient.update).toHaveBeenCalledWith(1, incidentDate, false, transactionalClient)
        expect(reportLogClient.insert).toHaveBeenCalledWith(transactionalClient, 'USER-1', 12, 'REPORT_MODIFIED', {
          formName: 'evidence',
          originalSection: {
            baggedEvidence: true,
          },
          updatedSection: {
            baggedEvidence: true,
          },
        })
      })
    })
  })
  describe('updateWithEdits', () => {
    const currentUser = { username: 'USER-1', token: 'token-1' }
    const reportId = 1
    const formName = 'incidentDetails'
    const updatedSection = {
      plannedUseOfForce: false,
    }
    const changes = [
      {
        agencyId: {
          oldValue: 'BSI',
          newValue: 'ALI',
          hasChanged: true,
        },
        incidentLocation: {
          oldValue: 'AAA',
          newValue: 'BBB',
          hasChanged: true,
        },
        plannedUseOfForce: {
          oldValue: true,
          newValue: false,
          hasChanged: true,
        },
        authorisedBy: {
          oldValue: 'Officer Smith',
          hasChanged: true,
        },
      },
    ]
    const incidentDate = new Date('2025-08-20T03:24:00')

    test('should update form body and prison correctly when a edit has occurred', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({
        id: 1,
        form: {
          incidentDetails: {
            authorisedBy: 'Officer Smith',
            plannedUseOfForce: true,
          },
        },
      } as Report)

      await service.updateWithEdits(
        currentUser as LoggedInUser,
        reportId,
        formName,
        updatedSection,
        changes as unknown,
        incidentDate
      )

      expect(incidentClient.updateAgencyId).toHaveBeenCalledWith(1, 'ALI')
      expect(incidentClient.update).toHaveBeenCalledWith(
        1,
        incidentDate,
        {
          incidentDetails: { plannedUseOfForce: false },
        },
        transactionalClient
      )
    })
  })
})
