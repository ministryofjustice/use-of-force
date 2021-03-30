import { Request, Response } from 'express'
import { ReportService } from '../../services'
import type { AnonReportSummaryWithPrison } from '../../services/reportService'
import RequestRemoval from './requestRemoval'

jest.mock('../../services/reportService')

describe('Request removal controller', () => {
  const reportService = new ReportService(null, null, null, null) as jest.Mocked<ReportService>

  let controller: RequestRemoval
  const req = ({
    originalUrl: 'http://localhost',
    params: { agencyId: 'MDI', offenderNo: 'A12345', bookingId: '12' },
    session: { userDetails: { name: 'Bob Smith', username: 'BOB_SMITH' } },
    body: {},
    flash: jest.fn(),
  } as unknown) as jest.Mocked<Request>

  const res = ({
    locals: {},
    render: jest.fn(),
    redirect: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown) as jest.Mocked<Response>

  const report: AnonReportSummaryWithPrison = {
    statementId: 1,
    incidentDate: new Date(1),
    agencyId: 'MDI',
    prisonName: 'Moorland HMP',
  }

  beforeEach(() => {
    const systemToken = jest.fn().mockResolvedValue('system-token-1')
    controller = new RequestRemoval(reportService, systemToken)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('view', () => {
    const mockFlashState = ({ errors }) => req.flash.mockReturnValueOnce(errors)
    it('Should render request removal page with repost summary details', async () => {
      reportService.getAnonReportSummary.mockResolvedValue(report)
      mockFlashState({ errors: [] })

      await controller.view(req, res, null)

      expect(res.render).toHaveBeenCalledWith('pages/statement/request-removal.html', { report, errors: [] })
    })
  })
})
