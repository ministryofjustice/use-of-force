import { Request, Response, NextFunction } from 'express'
import incidentDateCheck from './incidentDateCheck'
import DraftReportService from '../services/drafts/draftReportService'

describe('incidentDateCheck middleware', () => {
  let draftReportService: jest.Mocked<DraftReportService>
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    draftReportService = {
      getCurrentDraft: jest.fn(),
      isIncidentDateWithinSubmissionWindow: jest.fn(),
    } as unknown as jest.Mocked<DraftReportService>

    req = {
      params: { bookingId: '123' },
      user: {
        username: 'test.user',
        token: '',
      },
    }

    res = {
      locals: {},
    }

    next = jest.fn()
  })

  it('should allow submission when no incident date exists', async () => {
    draftReportService.getCurrentDraft.mockResolvedValue({
      incidentDate: null,
    } as never)

    const middleware = incidentDateCheck(draftReportService)

    await middleware(req as Request, res as Response, next)

    expect(draftReportService.getCurrentDraft).toHaveBeenCalledWith('test.user', 123)
    expect(draftReportService.isIncidentDateWithinSubmissionWindow).not.toHaveBeenCalled()
    expect(res.locals?.renderInProgressReportAsViewOnly).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  it('should allow submission when incident date is within submission window', async () => {
    const incidentDate = '2024-01-01'

    draftReportService.getCurrentDraft.mockResolvedValue({
      incidentDate,
    } as never)

    draftReportService.isIncidentDateWithinSubmissionWindow.mockReturnValue(true)

    const middleware = incidentDateCheck(draftReportService)

    await middleware(req as Request, res as Response, next)

    expect(draftReportService.isIncidentDateWithinSubmissionWindow).toHaveBeenCalledWith(new Date(incidentDate))
    expect(res.locals?.renderInProgressReportAsViewOnly).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  it('should prevent submission when incident date is outside submission window', async () => {
    const incidentDate = '2020-01-01'

    draftReportService.getCurrentDraft.mockResolvedValue({
      incidentDate,
    } as never)

    draftReportService.isIncidentDateWithinSubmissionWindow.mockReturnValue(false)

    const middleware = incidentDateCheck(draftReportService)

    await middleware(req as Request, res as Response, next)

    expect(res.locals?.renderInProgressReportAsViewOnly).toBe(true)
    expect(next).toHaveBeenCalled()
  })
})
