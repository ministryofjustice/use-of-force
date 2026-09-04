import { QueryPerformer } from './dataAccess/db'

type Action =
  | 'REPORT_CREATED'
  | 'REPORT_MODIFIED'
  | 'REPORT_DELETED'
  | 'REPORT_SUBMITTED'
  | 'REPORT_STATUS_CHANGED'
  | 'REPORT_COMPLETED'

export default class ReportLogClient {
  public async create(query: QueryPerformer, username: string, id: number): Promise<void> {
    await query({
      text: `insert into report_log (username, report_id, action, details, timestamp) values ($1, $2, $3, '{}', CURRENT_TIMESTAMP)`,
      values: [username, id, 'REPORT_CREATED'],
    })
  }

  public async insert(
    query: QueryPerformer,
    username: string,
    reportId: number,
    action: Action,
    details: Record<string, unknown> = {},
  ): Promise<void> {
    await query({
      text: `insert into report_log (username, report_id, action, details, timestamp) values ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      values: [username, reportId, action, details],
    })
  }
}
