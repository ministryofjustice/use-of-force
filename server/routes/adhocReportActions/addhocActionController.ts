/* eslint-disable no-await-in-loop */
import { Request, Response } from 'express'
import type ReportService from '../../services/reportService'
import { SystemToken } from '../../types/uof'
import NomisMappingService from '../../services/nomisMappingService'
import logger from '../../../log'

export default class AddhocActionController {
  constructor(
    private readonly reportService: ReportService,
    private readonly nomisMappingService: NomisMappingService,
    private readonly systemToken: SystemToken
  ) {}

  public updateReport = async (req: Request, res: Response): Promise<void> => {
    const { fromReportId, toReportId } = req.params
    const fromId = parseInt(fromReportId, 10)
    const toId = parseInt(toReportId, 10)

    for (let reportId = fromId; reportId <= toId; reportId += 1) {
      try {
        const report = await this.reportService.getReportUsingReportIdOnly(reportId)

        const { locationId } = report.form.incidentDetails

        if (report.form.incidentDetails.incidentLocationId) {
          logger.info(
            `Ad-hoc exercise: Report with id ${reportId} already has form_response.incidentDetails.incidentLocationId set`
          )
        } else if (locationId) {
          const token = await this.systemToken(req.user.username)

          const { dpsLocationId } =
            await this.nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId(token, locationId)

          report.form.incidentDetails.incidentLocationId = dpsLocationId

          const updatedSection = report.form.incidentDetails

          await this.reportService.update(res.locals.user, reportId, 'incidentDetails', updatedSection)

          logger.info(
            `Ad-hoc exercise: Updated report with id ${reportId} by adding form_response.incidentDetails.incidentLocationId mapped to nomis locationId of ${locationId}`
          )
        }
      } catch (error) {
        logger.error(`Ad-hoc exercise: Update of report with id ${reportId} failed.`, error.message)
      }
    }

    res.send(`Reports with id's ${fromId} to ${toId} processed`)
  }
}
