import format from 'pg-format'
import { QueryPerformer, InTransaction } from './dataAccess/db'
import { AgencyId } from '../types/uof'
import { ReportStatus, StatementStatus } from '../config/types'
import { IncidentSearchQuery, ReportSummary, IncompleteReportSummary } from './incidentClientTypes'

const maxSequenceForBooking =
  '(select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)'

export default class IncidentClient {
  constructor(private readonly query: QueryPerformer, private readonly inTransaction: InTransaction) {}

  async createDraftReport({ userId, bookingId, agencyId, reporterName, offenderNo, incidentDate, formResponse }) {
    const nextSequence = `(select COALESCE(MAX(sequence_no), 0) + 1 from v_report where booking_id = $5 and user_id = $2)`
    const result = await this.query({
      text: `insert into report (form_response, user_id, reporter_name, offender_no, booking_id, agency_id, status, incident_date, sequence_no, created_date)
              values ($1, CAST($2 AS VARCHAR), $3, $4, $5, $6, $7, $8, ${nextSequence}, CURRENT_TIMESTAMP)
              returning id`,
      values: [
        formResponse,
        userId,
        reporterName,
        offenderNo,
        bookingId,
        agencyId,
        ReportStatus.IN_PROGRESS.value,
        incidentDate,
      ],
    })
    return result.rows[0].id
  }

  updateDraftReport(reportId, incidentDate, formResponse) {
    return this.query({
      text: `update v_report r
            set form_response = COALESCE($1,   r.form_response)
            ,   incident_date = COALESCE($2,   r.incident_date)
            ,   updated_date = now()
            where r.id = $3`,
      values: [formResponse, incidentDate, reportId],
    })
  }

  submitReport(userId, bookingId, submittedDate, query: QueryPerformer = this.query) {
    return query({
      text: `update v_report r
            set status = $1
            ,   submitted_date = $2
            ,   updated_date = now()
          where r.user_id = $3
          and r.booking_id = $4
          and r.status = $5
          and r.sequence_no = ${maxSequenceForBooking}`,
      values: [ReportStatus.SUBMITTED.value, submittedDate, userId, bookingId, ReportStatus.IN_PROGRESS.value],
    })
  }

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

  async getCurrentDraftReport(userId, bookingId) {
    const results = await this.query({
      text: `select id, incident_date "incidentDate", form_response "form", agency_id "agencyId" from v_report r
          where r.user_id = $1
          and r.booking_id = $2
          and r.status = $3
          and r.sequence_no = ${maxSequenceForBooking}`,
      values: [userId, bookingId, ReportStatus.IN_PROGRESS.value],
    })
    return results.rows[0] || {}
  }

  async getReport(userId, reportId) {
    const results = await this.query({
      text: `select id
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

  async getReportForReviewer(reportId) {
    const results = await this.query({
      text: `select id
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

  async getIncompleteReportsForReviewer(
    agencyId: AgencyId,
    query: IncidentSearchQuery
  ): Promise<IncompleteReportSummary[]> {
    const isOverdue = `(select count(*) from "v_statement" s
                      where r.id = s.report_id 
                      and s.statement_status = $3
                      and s.overdue_date <= now()) > 0`

    const results = await this.query({
      text: `select r.id
            , r.booking_id     "bookingId"
            , r.reporter_name  "reporterName"
            , r.offender_no    "offenderNo"
            , r.incident_date  "incidentDate"
            , ${isOverdue}     "isOverdue"
            from v_report r
          where r.status = $1
          and   r.agency_id = $2
          and   r.offender_no = coalesce($4, r.offender_no)
          and   r.reporter_name Ilike coalesce($5, r.reporter_name)
          and   date_trunc('day', r.incident_date) >= coalesce($6, date_trunc('day', r.incident_date))
          and   date_trunc('day', r.incident_date) <= coalesce($7, date_trunc('day', r.incident_date))
          order by r.incident_date`,
      values: [
        ReportStatus.SUBMITTED.value,
        agencyId,
        StatementStatus.PENDING.value,
        query.prisonNumber,
        query.reporter ? `%${query.reporter}%` : null,
        query.dateFrom ? query.dateFrom.toDate() : null,
        query.dateTo ? query.dateTo.toDate() : null,
      ],
    })
    return results.rows
  }

  async getCompletedReportsForReviewer(agencyId: AgencyId, query: IncidentSearchQuery): Promise<ReportSummary[]> {
    const results = await this.query({
      text: `select r.id
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
          order by r.incident_date desc`,
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

  async getReports(userId: string): Promise<ReportSummary[]> {
    const reports = await this.query<ReportSummary>({
      text: `select r.id
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
            end), r.incident_date desc`,
      values: [userId],
    })
    return reports.rows
  }

  async getDraftInvolvedStaff(reportId) {
    const results = await this.query({
      text: 'select form_response "form" from v_report where id = $1',
      values: [reportId],
    })

    if (results.rows.length) {
      const { form: { incidentDetails: { involvedStaff = [] } = {} } = {} } = results.rows[0]
      return involvedStaff
    }
    return []
  }

  async getInvolvedStaff(reportId) {
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

  async deleteReport(reportId, now = new Date()) {
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

  async setNextReminderDate(statementId, nextDate, query = this.query): Promise<void> {
    await query({
      text: 'update v_statement set next_reminder_date = $1, updated_date = now() where id = $2',
      values: [nextDate, statementId],
    })
  }

  async updateAgencyId(agencyId: AgencyId, username, bookingId): Promise<void> {
    await this.query({
      text: `update v_report r
                  set agency_id = COALESCE($1,   r.agency_id)
                  ,   form_response = jsonb_set(form_Response, '{incidentDetails,locationId}', 'null'::jsonb)
                  where r.user_id = $2
                  and r.booking_id = $3
                  and r.sequence_no = ${maxSequenceForBooking}`,
      values: [agencyId, username, bookingId],
    })
  }
}
