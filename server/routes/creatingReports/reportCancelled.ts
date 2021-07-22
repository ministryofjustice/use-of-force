import { Request, Response, RequestHandler } from 'express'

export default class ReportCancelledRoutes {
  public view: RequestHandler = async (req: Request, res: Response) => res.render('formPages/incident/report-cancelled')
}
