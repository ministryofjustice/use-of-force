import format from 'pg-format'
import type { QueryPerformer } from './dataAccess/db'
import { PageResponse, buildPageResponse, HasTotalCount, offsetAndLimitForPage } from '../utils/page'
import type {
  StatementSummary,
  Statement,
  InvolvedStaffToRemove,
  AdditionalComment,
  UsernameToStatementIds,
  StatementUpdate,
  ReviewerStatement,
  RemovalRequest,
} from './statementsClientTypes'
import type { DraftInvolvedStaff } from '../services/drafts/draftInvolvedStaffService'
import { StatementStatus, LabelledValue } from '../config/types'

type StatementCreationResult = { id: number; userId: string }

export default class StatementsClient {
  constructor(private readonly query: QueryPerformer) {}

  async getStatements(userId: string, page: number): Promise<PageResponse<StatementSummary>> {
    const [offset, limit] = offsetAndLimitForPage(page)
    const result = await this.query<HasTotalCount<StatementSummary>>({
      text: `select r.id, count(*) OVER() AS "totalCount"
            , r.reporter_name                        "reporterName"
            , r.offender_no                          "offenderNo"
            , r.incident_date                        "incidentDate"
            , s."name"
            , s.in_progress                          "inProgress"
            , s.overdue_date <= now()                "isOverdue"
            , s.removal_requested_date is not null   "isRemovalRequested"
            , s.statement_status                     "status"
            from statement s 
            inner join report r on s.report_id = r.id   
          where s.user_id = $1
          and s.deleted is null
          order by status, r.incident_date desc
          offset $2
          limit $3`,
      values: [userId, offset, limit],
    })

    return buildPageResponse(result.rows, page)
  }

  async getStatementForUser(userId: string, reportId: number, status: LabelledValue): Promise<Statement> {
    const results = await this.query({
      text: `select s.id
            ,      r.booking_id             "bookingId"
            ,      r.incident_date          "incidentDate"
            ,      s.last_training_month    "lastTrainingMonth"
            ,      s.last_training_year     "lastTrainingYear"
            ,      s.job_start_year         "jobStartYear"
            ,      s.statement
            ,      s.submitted_date         "submittedDate"
            ,      s.name                   "name"
            ,      r.reporter_name          "reporterName"
            from report r
            left join statement s on r.id = s.report_id
            where r.id = $1
              and r.deleted is null
              and s.user_id = $2
              and s.statement_status = $3
              and s.deleted is null`,
      values: [reportId, userId, status.value],
    })
    return results.rows[0]
  }

  async getInvolvedStaffToRemove(statementId: number): Promise<InvolvedStaffToRemove> {
    const results = await this.query({
      text: `select s.id
            ,      s.user_id                                 "userId"
            ,      s.name                                    "name" 
            ,      s.email                                   "email"
            ,      r.incident_date                           "incidentDate"
            ,      r.submitted_date                          "submittedDate"
            from v_report r
            left join v_statement s on r.id = s.report_id
            where s.id = $1`,
      values: [statementId],
    })
    return results.rows[0]
  }

  async getStatementForReviewer(statementId: number): Promise<ReviewerStatement> {
    const results = await this.query({
      text: `select s.id
            ,      r.id                                      "reportId"
            ,      s.name
            ,      s.user_id                                 "userId"
            ,      (s.overdue_date <= now()) and 
                   (s.statement_status != $1)                "isOverdue"
            ,      s.statement_status = $1                   "isSubmitted"
            ,      s.removal_requested_date is not null      "isRemovalRequested"
            ,      r.booking_id                              "bookingId"
            ,      r.incident_date                           "incidentDate"
            ,      s.last_training_month                     "lastTrainingMonth"
            ,      s.last_training_year                      "lastTrainingYear"
            ,      s.job_start_year                          "jobStartYear"
            ,      s.statement
            ,      s.submitted_date                          "submittedDate"
            from v_report r
            left join v_statement s on r.id = s.report_id
            where s.id = $2`,
      values: [StatementStatus.SUBMITTED.value, statementId],
    })
    return results.rows[0]
  }

  async getStatementsForReviewer(reportId: number): Promise<ReviewerStatement[]> {
    const results = await this.query({
      text: `select s.id
            ,      r.id                                   "reportId"
            ,      s.name
            ,      s.email
            ,      s.user_id                              "userId"
            ,      (s.overdue_date <= now()) and
                   (s.statement_status != $1)             "isOverdue"
            ,      s.statement_status = $1                "isSubmitted"
            ,      s.removal_requested_date is not null   "isRemovalRequested"
            ,      r.booking_id                           "bookingId"
            ,      r.incident_date                        "incidentDate"
            ,      s.last_training_month                  "lastTrainingMonth"
            ,      s.last_training_year                   "lastTrainingYear"
            ,      s.job_start_year                       "jobStartYear"
            ,      s.statement
            ,      s.submitted_date                       "submittedDate"
            from v_report r
            left join v_statement s on r.id = s.report_id
            where report_id = $2
            order by s.name`,
      values: [StatementStatus.SUBMITTED.value, reportId],
    })
    return results.rows
  }

  async getAdditionalComments(statementId: number): Promise<AdditionalComment[]> {
    const results = await this.query({
      text: `select  
    s.additional_comment "additionalComment",
    s.date_submitted     "dateSubmitted" 
    from v_statement_amendments s
    where s.statement_id = $1`,
      values: [statementId],
    })
    return results.rows
  }

  async saveAdditionalComment(
    statementId: number,
    additionalComment: string,
    query: QueryPerformer = this.query
  ): Promise<void> {
    await query({
      text: `insert into v_statement_amendments (statement_id, additional_comment)
            values ($1, $2)`,
      values: [statementId, additionalComment],
    })
  }

  async saveStatement(
    userId: string,
    reportId: number,
    { lastTrainingMonth, lastTrainingYear, jobStartYear, statement }: StatementUpdate,
    query: QueryPerformer = this.query
  ): Promise<void> {
    await query({
      text: `update v_statement 
    set last_training_month = $1
    ,   last_training_year = $2
    ,   job_start_year = $3
    ,   statement = $4
    ,   updated_date = CURRENT_TIMESTAMP
    ,   in_progress = true
    where user_id = $5
    and report_id = $6
    and statement_status = $7`,
      values: [
        lastTrainingMonth,
        lastTrainingYear,
        jobStartYear,
        statement,
        userId,
        reportId,
        StatementStatus.PENDING.value,
      ],
    })
  }

  async submitStatement(userId: string, reportId: number, query: QueryPerformer = this.query): Promise<void> {
    await query({
      text: `update v_statement 
    set submitted_date = CURRENT_TIMESTAMP
    ,   statement_status = $1
    ,   updated_date = CURRENT_TIMESTAMP
    where user_id = $2
    and report_id = $3
    and statement_status = $4`,
      values: [StatementStatus.SUBMITTED.value, userId, reportId, StatementStatus.PENDING.value],
    })
  }

  async setEmail(
    userId: string,
    reportId: number,
    emailAddress: string,
    query: QueryPerformer = this.query
  ): Promise<void> {
    await query({
      text: `update v_statement 
    set email = $3
    ,   updated_date = CURRENT_TIMESTAMP
    where user_id = $1
    and report_id = $2`,
      values: [userId, reportId, emailAddress],
    })
  }

  async getNumberOfPendingStatements(reportId: number, query: QueryPerformer = this.query): Promise<number> {
    const { rows } = await query({
      text: `select count(*) from v_statement where report_id = $1 AND statement_status = $2`,
      values: [reportId, StatementStatus.PENDING.value],
    })
    return parseInt(rows[0].count, 10)
  }

  async createStatements(
    reportId: number,
    firstReminder: Date,
    overdueDate: Date,
    staff: DraftInvolvedStaff[],
    query = this.query
  ): Promise<UsernameToStatementIds> {
    const rows = staff.map(s => [
      reportId,
      s.staffId,
      s.username,
      s.name,
      s.email,
      firstReminder,
      overdueDate,
      StatementStatus.PENDING.value,
    ])
    const results = await query<StatementCreationResult>({
      text: format(
        'insert into v_statement (report_id, staff_id, user_id, name, email, next_reminder_date, overdue_date, statement_status) VALUES %L returning id, user_id "userId"',
        rows
      ),
    })
    return results.rows.reduce<UsernameToStatementIds>(
      (result, staffMember) => ({ ...result, [staffMember.userId]: staffMember.id }),
      {}
    )
  }

  async deleteStatement({ statementId, query, now = new Date() }): Promise<void> {
    await query({
      text: `update statement set deleted = $1 where id = $2`,
      values: [now, statementId],
    })
    await query({
      text: `update statement_amendments set deleted = $1 where statement_id = $2`,
      values: [now, statementId],
    })
  }

  async isStatementPresentForUser(
    reportId: number,
    username: string,
    query: QueryPerformer = this.query
  ): Promise<boolean> {
    const { rows } = await query({
      text: `select count(*) from v_statement where report_id = $1 and user_id = $2`,
      values: [reportId, username],
    })
    return parseInt(rows[0].count, 10) > 0
  }

  async requestStatementRemoval(statementId: number, reason: string): Promise<void> {
    await this.query({
      text: `update "statement"
              set removal_requested_date = now()
              ,   removal_requested_reason = $1
              ,   updated_date = now()
              where id = $2`,
      values: [reason, statementId],
    })
  }

  async refuseStatementRemoval(statementId: number): Promise<void> {
    await this.query({
      text: `update "statement"
              set removal_requested_date = null
              ,   removal_requested_reason = null
              ,   updated_date = now()
              where id = $1`,
      values: [statementId],
    })
  }

  async getRemovalRequest(statementId: number): Promise<RemovalRequest> {
    const { rows } = await this.query({
      text: `select s.removal_requested_reason "removalRequestedReason"
              , s.removal_requested_date is not null "isRemovalRequested"
              from v_statement s 
              where id = $1`,
      values: [statementId],
    })
    return rows[0]
  }
}
