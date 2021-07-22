import { QueryPerformer } from './dataAccess/db'
import { ReportStatus } from '../config/types'
import { DraftReport, NoDraftReport, StaffDetails, OffenderReport } from './draftReportClientTypes'
import { AgencyId, DateRange } from '../types/uof'
import ReportLogClient from './reportLogClient'

const maxSequenceForBooking =
  '(select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)'

export default class DraftReportClient {
  constructor(private readonly query: QueryPerformer, private readonly reportLogClient: ReportLogClient) {}

  async create(
    { userId, bookingId, agencyId, reporterName, offenderNo, incidentDate, formResponse },
    query: QueryPerformer = this.query
  ): Promise<number> {
    const nextSequence = `(select COALESCE(MAX(sequence_no), 0) + 1 from v_report where booking_id = $5 and user_id = $2)`
    const result = await query({
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

  async submit(reportId: number, userId: string, submittedDate: Date, query: QueryPerformer): Promise<void> {
    await query({
      text: `update v_report r
            set status = $1
            ,   submitted_date = $2
            ,   updated_date = now()
          where r.id = $3
          and r.status = $4`,
      values: [ReportStatus.SUBMITTED.value, submittedDate, reportId, ReportStatus.IN_PROGRESS.value],
    })
    await this.reportLogClient.insert(query, userId, reportId, 'REPORT_SUBMITTED')
  }

  async get(
    userId: string,
    bookingId: number,
    query: QueryPerformer = this.query
  ): Promise<DraftReport | NoDraftReport> {
    const results = await query({
      text: `select id, incident_date "incidentDate", form_response "form", agency_id "agencyId" from v_report r
          where r.user_id = $1
          and r.booking_id = $2
          and r.status = $3
          and r.sequence_no = ${maxSequenceForBooking}`,
      values: [userId, bookingId, ReportStatus.IN_PROGRESS.value],
    })
    return results.rows[0] || {}
  }

  async getInvolvedStaff(
    username: string,
    bookingId: number,
    query: QueryPerformer = this.query
  ): Promise<StaffDetails[]> {
    const results = await query({
      text: 'select form_response "form" from v_report where booking_id = $1 and user_id = $2 and status = $3',
      values: [bookingId, username, ReportStatus.IN_PROGRESS.value],
    })

    if (results.rows.length) {
      const { form: { involvedStaff = [] } = {} } = results.rows[0]
      return involvedStaff
    }
    return []
  }

  async updateAgencyId(agencyId: AgencyId, username: string, bookingId: number): Promise<void> {
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

  async getDuplicateReports(bookingId: number, [startDate, endDate]: DateRange): Promise<OffenderReport[]> {
    const results = await this.query({
      text: `select r.incident_date date
              ,   r.form_response -> 'incidentDetails' ->> 'locationId' "locationId"
              ,   r.reporter_name reporter
              ,   r.status status
              from v_report r
              where r.booking_id >= $1
              and r.incident_date >= $2
              and r.incident_date <= $3
              and r.status != $4`,
      values: [bookingId, startDate, endDate, ReportStatus.IN_PROGRESS.value],
    })
    return results.rows
  }

  async deleteReport(userId: string, bookingId: number, now: Date = new Date()): Promise<void> {
    await this.query({
      text: `update v_report r
              set deleted = $1 
              where r.user_id = $2
              and r.booking_id = $3
              and r.status = $4`,
      values: [now, userId, bookingId, ReportStatus.IN_PROGRESS.value],
    })
  }
}
