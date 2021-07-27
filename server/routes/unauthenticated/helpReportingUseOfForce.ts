import type { Request, Response } from 'express'
import config from '../../config'

export default function HelpReportingUseOfForce() {
  return (req: Request, res: Response): void => {
    res.render(`help-reporting-use-of-force.html`, {
      supportTelephone: config.supportTelephone,
      supportExtension: config.supportExtension,
    })
  }
}
