import express, { Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'

import IncidentRoutes from './incidents'
import StatementRoutes from './statements'

import type { Services } from '../../services'

export default function ViewingReportsRoutes(services: Services): Router {
  const { statementService, offenderService, reportService, reportDetailBuilder, systemToken } = services

  const router = express.Router()

  const incidents = new IncidentRoutes(reportService, reportDetailBuilder)

  const statements = new StatementRoutes(statementService, offenderService, systemToken)

  const get = (path, handler) => router.get(path, asyncMiddleware(handler))
  const post = (path, handler) => router.post(path, asyncMiddleware(handler))

  get('/', incidents.redirectToHomePage)
  get('/your-reports', incidents.viewYourReports)
  get('/:reportId/your-report', incidents.viewYourReport)

  get('/your-statements', statements.viewYourStatements)
  get('/:reportId/write-your-statement', statements.viewWriteYourStatement)
  post('/:reportId/write-your-statement', statements.submitWriteYourStatement)
  get('/:reportId/check-your-statement', statements.viewCheckYourStatement)
  post('/:reportId/check-your-statement', statements.submitCheckYourStatement)
  get('/:reportId/statement-submitted', statements.viewStatementSubmitted)
  get('/:reportId/your-statement', statements.viewYourStatement)
  get('/:reportId/add-comment-to-statement', statements.viewAddCommentToStatement)
  post('/:reportId/add-comment-to-statement', statements.saveAdditionalComment)

  return router
}
