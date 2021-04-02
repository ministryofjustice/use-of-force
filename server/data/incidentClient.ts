import { QueryPerformer, InTransaction } from './dataAccess/db'
import { AgencyId } from '../types/uof'
import { ReportStatus, StatementStatus } from '../config/types'
import {
  IncidentSearchQuery,
  ReportSummary,
  IncompleteReportSummary,
  InvolvedStaff,
  Report,
  AnonReportSummary,
} from './incidentClientTypes'
import { PageResponse, buildPageResponse, HasTotalCount, offsetAndLimitForPage } from '../utils/page'

export default class IncidentClient {
  constructor(private readonly query: QueryPerformer, private readonly inTransaction: InTransaction) {}

  changeStatus(reportId, startState, endState, query: QueryPerformer = this.query) {
    return query({
      text: `update v_report r
            set status = $1
            ,   updated_date = now()
          where id = $2
          and status = $3`,
      values: [endState.value, reportId, startState.value],
    })
  }

  async getReport(userId: string, reportId: number): Promise<Report> {
    const results = await this.query({
      text: `select id
          , user_id "username"
          , incident_date "incidentDate"
          , agency_id "agencyId"
          , submitted_date "submittedDate"
          , reporter_name "reporterName"
          , form_response "form"
          , booking_id "bookingId"
          from v_report r
          where r.user_id = $1 and r.id = $2`,
      values: [userId, reportId],
    })
    return results.rows[0]
  }

  async getAnonReportSummary(statementId: number): Promise<AnonReportSummary | undefined> {
    const results = await this.query({
      text: `select vs.id "statementId"
            ,  vr.incident_date "incidentDate"
            ,  vr.agency_id "agencyId"
            from v_statement vs
            join v_report vr on vs.report_id = vr.id
            where vs.id = $1`,
      values: [statementId],
    })
    return results.rows[0]
  }

  async getReportForReviewer(reportId: number): Promise<Report> {
    const results = await this.query({
      text: `select id
          , user_id "username"
          , incident_date "incidentDate"
          , agency_id "agencyId"
          , submitted_date "submittedDate"
          , reporter_name "reporterName"
          , form_response "form"
          , booking_id    "bookingId"
          , status
          from v_report r
          where r.id = $1`,
      values: [reportId],
    })
    return results.rows[0]
  }

  async getIncompleteReportsForReviewer(agencyId: AgencyId): Promise<IncompleteReportSummary[]> {
    const isOverdue = `(select count(*) from "v_statement" s
                      where r.id = s.report_id 
                      and (s.statement_status = $3 or s.statement_status = $4)
                      and s.overdue_date <= now()) > 0`

    const isRemovalRequested = `(select count(*) from "v_statement" s
                      where r.id = s.report_id
                      and s.statement_status = $4) > 0`

    const results = await this.query({
      text: `select r.id
            , r.booking_id     "bookingId"
            , r.reporter_name  "reporterName"
            , r.offender_no    "offenderNo"
            , r.incident_date  "incidentDate"
            , ${isOverdue}     "isOverdue"
            , ${isRemovalRequested}  "isRemovalRequested"
            from v_report r
          where r.status = $1
          and   r.agency_id = $2
          order by r.incident_date`,
      values: [
        ReportStatus.SUBMITTED.value,
        agencyId,
        StatementStatus.PENDING.value,
        StatementStatus.REMOVAL_REQUESTED.value,
      ],
    })
    return results.rows
  }

  private getCompleteReportQuery(paged: boolean): string {
    return `select r.id${paged ? ', count(*) OVER() AS "totalCount"' : ''}
            , r.booking_id     "bookingId"
            , r.reporter_name  "reporterName"
            , r.offender_no    "offenderNo"
            , r.incident_date  "incidentDate"
            from v_report r
          where r.status = $1
          and   r.agency_id = $2
          and   r.offender_no = coalesce($3, r.offender_no)
          and   r.reporter_name Ilike coalesce($4, r.reporter_name)
          and   date_trunc('day', r.incident_date) >= coalesce($5, date_trunc('day', r.incident_date))
          and   date_trunc('day', r.incident_date) <= coalesce($6, date_trunc('day', r.incident_date))
          order by r.incident_date desc${paged ? ' offset $7 limit $8' : ''}`
  }

  async getAllCompletedReportsForReviewer(agencyId: AgencyId, query: IncidentSearchQuery): Promise<ReportSummary[]> {
    const results = await this.query({
      text: this.getCompleteReportQuery(false),
      values: [
        ReportStatus.COMPLETE.value,
        agencyId,
        query.prisonNumber,
        query.reporter ? `%${query.reporter}%` : null,
        query.dateFrom && query.dateFrom.toDate(),
        query.dateTo && query.dateTo.toDate(),
      ],
    })
    return results.rows
  }

  async getCompletedReportsForReviewer(
    agencyId: AgencyId,
    query: IncidentSearchQuery,
    page: number
  ): Promise<PageResponse<ReportSummary>> {
    const [offset, limit] = offsetAndLimitForPage(page)
    const results = await this.query<HasTotalCount<ReportSummary>>({
      text: this.getCompleteReportQuery(true),
      values: [
        ReportStatus.COMPLETE.value,
        agencyId,
        query.prisonNumber,
        query.reporter ? `%${query.reporter}%` : null,
        query.dateFrom && query.dateFrom.toDate(),
        query.dateTo && query.dateTo.toDate(),
        offset,
        limit,
      ],
    })

    return buildPageResponse(results.rows, page)
  }

  async getReports(userId: string, page: number): Promise<PageResponse<ReportSummary>> {
    const [offset, limit] = offsetAndLimitForPage(page)
    const result = await this.query<HasTotalCount<ReportSummary>>({
      text: `select r.id, count(*) OVER() AS "totalCount"
            , r.booking_id    "bookingId"
            , r.reporter_name "reporterName"
            , r.offender_no   "offenderNo"
            , r.incident_date "incidentDate"
            , r.status        "status"
            from v_report r
          where r.user_id = $1
          order by (case status 
            when 'IN_PROGRESS' then 1
            else 2
            end), r.incident_date desc
          offset $2
          limit $3`,
      values: [userId, offset, limit],
    })
    return buildPageResponse(result.rows, page)
  }

  async getInvolvedStaff(reportId: number): Promise<InvolvedStaff[]> {
    const results = await this.query({
      text: `select s.id     "statementId"
    ,      s.user_id       "userId"
    ,      s.name          "name"
    ,      s.email         "email"
    from v_statement s 
    where s.report_id = $1`,
      values: [reportId],
    })
    return results.rows
  }

  async deleteReport(reportId: number, now: Date = new Date()): Promise<void> {
    return this.inTransaction(async query => {
      await query({ text: `update report set deleted = $1 where id = $2`, values: [now, reportId] })

      const statementQuery = `(select id from statement where report_id = $2)`

      await query({
        text: `update statement set deleted = $1 where id in ${statementQuery}`,
        values: [now, reportId],
      })
      await query({
        text: `update statement_amendments set deleted = $1 where statement_id in ${statementQuery}`,
        values: [now, reportId],
      })
    })
  }

  // Note: this locks the statement row until surrounding transaction is committed so is not suitable for general use
  async getNextNotificationReminder(transactionalClient: QueryPerformer) {
    const result = await transactionalClient({
      text: `select s.id                     "statementId"
          ,       r.id                     "reportId"
          ,       s.user_id                "userId"
          ,       s.email                  "recipientEmail" 
          ,       s.name                   "recipientName"
          ,       s.next_reminder_date     "nextReminderDate"  
          ,       r.submitted_date         "submittedDate"
          ,       r.reporter_name          "reporterName"
          ,       r.incident_date          "incidentDate"
          ,       r.user_id = s.user_id    "isReporter"
          ,       s.overdue_date           "overdueDate"
          ,       s.overdue_date <= now()  "isOverdue"
          from statement s
          left join report r on r.id = s.report_id
          where s.next_reminder_date < now()
          and s.statement_status = $1
          and s.deleted is null
          order by s.id
          for update of s skip locked
          LIMIT 1`,
      values: [StatementStatus.PENDING.value],
    })
    const {
      rows: [reminder],
    } = result
    return reminder
  }

  async setNextReminderDate(statementId: number, nextDate: Date, query: QueryPerformer = this.query): Promise<void> {
    await query({
      text: 'update v_statement set next_reminder_date = $1, updated_date = now() where id = $2',
      values: [nextDate, statementId],
    })
  }
}
