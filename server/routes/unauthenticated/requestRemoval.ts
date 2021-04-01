import type { Request, RequestHandler } from 'express'
import { paths } from '../../config/incident'
import type { ReportService, StatementService } from '../../services'
import { SystemToken } from '../../types/uof'

const extractStatementId = (req: Request): number => parseInt(req.params.statementId, 10)

export default class RemovalRequest {
  constructor(
    private readonly reportService: ReportService,
    private readonly statementService: StatementService,
    private readonly systemToken: SystemToken
  ) {}

  view: RequestHandler = async (req, res) => {
    const statementId = extractStatementId(req)
    const token = await this.systemToken()
    const report = await this.reportService.getAnonReportSummary(token, statementId)

    const errors = req.flash('errors')

    return res.render(`pages/statement/request-removal.html`, { errors, report })
  }

  submit: RequestHandler = async (req, res) => {
    const statementId = extractStatementId(req)
    const { reason } = req.body
    if (!reason) {
      req.flash('errors', [
        {
          text: 'Enter why you should be removed from this incident',
          href: '#reason',
        },
      ])
      return res.redirect(paths.requestRemoval(statementId))
    }

    await this.statementService.requestStatementRemoval(statementId, reason)
    return res.redirect('/removal-requested')
  }

  viewConfirmation: RequestHandler = (req, res) => {
    return res.render(`pages/statement/removal-requested.html`)
  }
}
