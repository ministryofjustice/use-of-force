import type { Request, RequestHandler } from 'express'
import createHttpError from 'http-errors'
import { isHashOfString } from '../../utils/hash'
import { paths } from '../../config/incident'
import type { ReportService, StatementService } from '../../services'
import { SystemToken } from '../../types/uof'
import config from '../../config'

const extractStatementId = (req: Request): number => parseInt(req.params.statementId, 10)

export default class RemovalRequest {
  constructor(
    private readonly reportService: ReportService,
    private readonly statementService: StatementService,
    private readonly systemToken: SystemToken
  ) {}

  view: RequestHandler = async (req, res, next) => {
    const statementId = extractStatementId(req)
    const { signature } = req.query

    if (!isHashOfString(signature?.toString() || '', statementId.toString(), config.email.urlSigningSecret)) {
      return next(createHttpError(404, 'Not found'))
    }

    const report = await this.reportService.getAnonReportSummary(await this.systemToken(), statementId)

    if (!report) {
      return res.redirect(paths.alreadyRemoved())
    }

    return res.render(`pages/statement/request-removal.html`, { errors: req.flash('errors'), report, signature })
  }

  submit: RequestHandler = async (req, res, next) => {
    const statementId = extractStatementId(req)
    const { reason, signature } = req.body

    if (!isHashOfString(signature?.toString() || '', statementId.toString(), config.email.urlSigningSecret)) {
      return next(createHttpError(404, 'Not found'))
    }

    if (!reason) {
      req.flash('errors', [
        {
          text: 'Enter why you should be removed from this incident',
          href: '#reason',
        },
      ])
      return res.redirect(paths.requestRemoval(statementId, signature))
    }

    await this.statementService.requestStatementRemoval(statementId, reason)
    return res.redirect(paths.removalRequested())
  }

  viewConfirmation: RequestHandler = (req, res) => {
    return res.render(`pages/statement/removal-requested.html`)
  }

  viewAlreadyRemoved: RequestHandler = (req, res) => {
    return res.render(`pages/statement/already-removed.html`)
  }
}
