import { Request, Response, RequestHandler } from 'express'

export default class ReportHasBeenDeletedRoutes {
  public view: RequestHandler = async (req: Request, res: Response) => {
    return res.render(`formPages/incident/report-has-been-deleted`, {
      pageData: { pageTitle: 'This report has been deleted' },
    })
  }
}
