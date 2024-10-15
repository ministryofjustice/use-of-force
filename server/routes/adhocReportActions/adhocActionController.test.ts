import { Request, Response } from 'express'
import { ReportService, NomisMappingService } from '../../services'
import AddhocActionController from './addhocActionController'
import { LocationMapping } from '../../data/nomisMappingClientTypes'
import logger from '../../../log'

jest.mock('../../services/nomisMappingService')
jest.mock('../../services/reportService')
jest.mock('../../../log')

const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>
const nomisMappingService = new NomisMappingService(null) as jest.Mocked<NomisMappingService>

reportService.getReport = jest.fn()
let req = jest.fn() as unknown as jest.Mocked<Request>
let res = jest.fn() as unknown as jest.Mocked<Response>
res.send = jest.fn()

req = {
  params: {
    fromReportId: '1',
    toReportId: '2',
  },
  user: {
    username: 'user_name',
    token: '',
    refreshToken: '',
    refreshTime: undefined,
  },
} as any

res = {
  locals: {
    user: {
      username: 'user_name',
      token: '',
      refreshToken: '',
      refreshTime: undefined,
    },
  },
  send: jest.fn(),
} as any

const systemToken = jest.fn()
systemToken.mockResolvedValue('system-token-1')

const controller = new AddhocActionController(reportService, nomisMappingService, systemToken)

describe('Adhoc actions', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('updateReport', () => {
    it('is successful', async () => {
      await controller.updateReport(req, res)
      expect(res.send).toHaveBeenCalledWith("Reports with id's 1 to 2 processed")
    })

    it('calls the report service to get reports correctly', async () => {
      await controller.updateReport(req, res)

      expect(reportService.getReportUsingReportIdOnly).toHaveBeenCalledTimes(2)
      expect(reportService.getReportUsingReportIdOnly).toHaveBeenCalledWith(1)
      expect(reportService.getReportUsingReportIdOnly).toHaveBeenCalledWith(2)
    })

    it('does not do update if incidentLocationId already exists', async () => {
      const report = {
        form: {
          incidentDetails: {
            incidentLocationId: 'some-uuid',
            plannedUseOfForce: false,
          },
        },
      }

      reportService.getReportUsingReportIdOnly.mockResolvedValue(report as any)
      await controller.updateReport(req, res)

      expect(reportService.update).not.toHaveBeenCalled()

      expect(logger.info).toHaveBeenCalledWith(
        'Ad-hoc exercise: Report with id 1 already has form_response.incidentDetails.incidentLocationId set'
      )
    })

    it('should call update processes but only for a reports that exist', async () => {
      const report = {
        form: {
          incidentDetails: {
            locationId: 123456,
            plannedUseOfForce: false,
          },
        },
      }

      reportService.getReportUsingReportIdOnly.mockResolvedValueOnce(report as any)
      reportService.getReportUsingReportIdOnly.mockRejectedValueOnce(Error(`Report does not exist: 2`))

      nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId.mockResolvedValue({
        dpsLocationId: 'some-uuid',
      } as LocationMapping)

      await controller.updateReport(req, res)

      expect(reportService.update).toHaveBeenCalledWith(
        { refreshTime: undefined, refreshToken: '', token: '', username: 'user_name' },
        1,
        'incidentDetails',
        { incidentLocationId: 'some-uuid', locationId: 123456, plannedUseOfForce: false }
      )

      expect(logger.info).toHaveBeenCalledWith(
        'Ad-hoc exercise: Updated report with id 1 by adding form_response.incidentDetails.incidentLocationId mapped to nomis locationId of 123456'
      )
      expect(logger.error).toHaveBeenLastCalledWith(
        'Ad-hoc exercise: Update of report with id 2 failed.',
        'Report does not exist: 2'
      )
    })

    it('should catch errors', async () => {
      req = {
        params: {
          fromReportId: '1',
          toReportId: '1',
        },
        user: {
          username: 'user_name',
          token: '',
          refreshToken: '',
          refreshTime: undefined,
        },
      } as any

      const report = {
        form: {
          incidentDetails: {
            locationId: 123456,
            plannedUseOfForce: false,
          },
        },
      }

      reportService.getReportUsingReportIdOnly.mockResolvedValue(report as any)

      nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId.mockResolvedValue({
        dpsLocationId: 'some-uuid',
      } as LocationMapping)

      reportService.update.mockRejectedValue(new Error())

      await controller.updateReport(req, res)

      expect(logger.error).toHaveBeenLastCalledWith('Ad-hoc exercise: Update of report with id 1 failed.', '')
    })
  })
})
