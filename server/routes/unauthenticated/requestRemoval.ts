import type { Request, RequestHandler } from 'express'
import type { ReportService } from '../../services'
import { SystemToken } from '../../types/uof'

const extractStatementId = (req: Request): number => parseInt(req.params.statementId, 10)

export default class RemovalRequest {
  constructor(private readonly reportService: ReportService, private readonly systemToken: SystemToken) {}

  view: RequestHandler = async (req, res) => {
    const statementId = extractStatementId(req)
    const token = await this.systemToken()
    const report = await this.reportService.getAnonReportSummary(token, statementId)

    const errors = req.flash('errors')

    return res.render(`pages/statement/request-removal.html`, { errors, report })
  }

  submit: RequestHandler = async (req, res) => {
    const statementId = extractStatementId(req)

    return res.redirect(`/request-removal/${statementId}`)
  }
}
