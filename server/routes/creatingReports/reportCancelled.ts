import { Request, Response, RequestHandler } from 'express'

export default class ReportCancelledRoutes {
  public view: RequestHandler = async (req: Request, res: Response) => {
    return res.render(`formPages/incident/report-cancelled`, {
      pageData: { pageTitle: 'Your report has been cancelled' },
    })
  }
}
