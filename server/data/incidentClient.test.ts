import moment from 'moment'
import IncidentClient from './incidentClient'
import { ReportStatus, StatementStatus } from '../config/types'
import { PageResponse } from '../utils/page'
import ReportLogClient from './reportLogClient'

jest.mock('./reportLogClient')

const reportLogClient = new ReportLogClient() as jest.Mocked<ReportLogClient>
let incidentClient: IncidentClient
const query = jest.fn()
const transactionalQuery = jest.fn()
const inTransaction = callback => callback(transactionalQuery)

beforeEach(() => {
  jest.resetAllMocks()
  incidentClient = new IncidentClient(query, inTransaction, reportLogClient)
  query.mockResolvedValue({ rows: [] })
  transactionalQuery.mockResolvedValue({ rows: [] })
})

test('getReports', async () => {
  const results = await incidentClient.getReports('user1', 1)

  expect(results).toStrictEqual(new PageResponse({ max: 0, min: 0, page: 1, totalCount: 0, totalPages: 0 }, []))

  expect(query).toHaveBeenCalledWith({
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
    values: ['user1', 0, 20],
  })
})

test('getReportEdits', () => {
  incidentClient.getReportEdits(1)

  expect(query).toBeCalledWith({
    text: `select id
          , edit_date "editDate"
          , editor_user_id "editorUserId"
          , editor_name "editorName"
          , report_id "reportId"
          , change_to "changeTo"
          , old_value_primary "oldValuePrimary"
          , old_value_secondary "oldValueSecondary"
          , new_value_primary "newValuePrimary"
          , new_value_secondary "newValueSecondary"
          , reason "reason"
          , additional_comments "additionalComments"
          , report_owner_changed "reportOwnerChanged"
          from report_edit r
          where r.report_id = $1
          ORDER BY edit_date ASC`,
    values: [1],
  })
})

test('getReportForReviewer', () => {
  incidentClient.getReportForReviewer(1)

  expect(query).toHaveBeenCalledWith({
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
    values: [1],
  })
})

test('getIncompleteReportsForReviewer', () => {
  const isOverdue = `(select count(*) from "v_statement" s
                      where r.id = s.report_id 
                      and s.statement_status = $3
                      and s.overdue_date <= now()) > 0`

  const isRemovalRequested = `(select count(*) from "v_statement" s
                      where r.id = s.report_id
                      and s.removal_requested_date is not null) > 0`

  incidentClient.getIncompleteReportsForReviewer('agency-1')

  expect(query).toHaveBeenCalledWith({
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
    values: [ReportStatus.SUBMITTED.value, 'agency-1', StatementStatus.PENDING.value],
  })
})

test('getAllCompletedReportsForReviewer', () => {
  incidentClient.getAllCompletedReportsForReviewer('agency-1', {
    prisonNumber: 'A1234AB',
    reporter: 'reporter',
    dateFrom: moment('2020-01-29'),
    dateTo: moment('2020-01-30'),
  })

  expect(query).toHaveBeenCalledWith({
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
      'agency-1',
      'A1234AB',
      '%reporter%',
      moment('2020-01-29').toDate(),
      moment('2020-01-30').toDate(),
    ],
  })
})

test('getCompletedReportsForReviewer', async () => {
  const results = await incidentClient.getCompletedReportsForReviewer(
    'agency-1',
    {
      prisonNumber: 'A1234AB',
      reporter: 'reporter',
      dateFrom: moment('2020-01-29'),
      dateTo: moment('2020-01-30'),
    },
    1
  )

  expect(results).toStrictEqual(new PageResponse({ max: 0, min: 0, page: 1, totalCount: 0, totalPages: 0 }, []))

  expect(query).toHaveBeenCalledWith({
    text: `select r.id, count(*) OVER() AS "totalCount"
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
          order by r.incident_date desc offset $7 limit $8`,
    values: [
      ReportStatus.COMPLETE.value,
      'agency-1',
      'A1234AB',
      '%reporter%',
      moment('2020-01-29').toDate(),
      moment('2020-01-30').toDate(),
      0,
      20,
    ],
  })
})

test('getReport', () => {
  incidentClient.getReport('user1', 1)

  expect(query).toHaveBeenCalledWith({
    text: `select id
          , user_id "username"
          , incident_date "incidentDate"
          , agency_id "agencyId"
          , submitted_date "submittedDate"
          , reporter_name "reporterName"
          , form_response "form"
          , booking_id "bookingId"
          , status "status"
          from v_report r
          where r.user_id = $1 and r.id = $2`,
    values: ['user1', 1],
  })
})

test('getAnonReportSummary', () => {
  incidentClient.getAnonReportSummary(1)

  expect(query).toHaveBeenCalledWith({
    text: `select vs.id "statementId"
            ,  vr.incident_date "incidentDate"
            ,  vr.agency_id "agencyId"
            ,  vs.removal_requested_date is not null "isRemovalRequested"
            from v_statement vs
            join v_report vr on vs.report_id = vr.id
            where vs.id = $1`,
    values: [1],
  })
})

describe('changeStatus', () => {
  test('changeStatus to incomplete', async () => {
    await incidentClient.changeStatus(1, 'USER-1', ReportStatus.COMPLETE, ReportStatus.SUBMITTED, transactionalQuery)

    expect(transactionalQuery).toHaveBeenCalledWith({
      text: `update v_report r
            set status = $1
            ,   updated_date = now()
          where id = $2
          and status = $3`,
      values: [ReportStatus.SUBMITTED.value, 1, ReportStatus.COMPLETE.value],
    })

    expect(reportLogClient.insert).toHaveBeenCalledWith(transactionalQuery, 'USER-1', 1, 'REPORT_STATUS_CHANGED', {
      new: 'SUBMITTED',
      old: 'COMPLETE',
    })
  })

  test('changeStatus to complete', async () => {
    await incidentClient.changeStatus(1, 'USER-1', ReportStatus.SUBMITTED, ReportStatus.COMPLETE, transactionalQuery)

    expect(transactionalQuery).toHaveBeenCalledWith({
      text: `update v_report r
            set status = $1
            ,   updated_date = now()
          where id = $2
          and status = $3`,
      values: [ReportStatus.COMPLETE.value, 1, ReportStatus.SUBMITTED.value],
    })

    expect(reportLogClient.insert).toHaveBeenCalledWith(transactionalQuery, 'USER-1', 1, 'REPORT_COMPLETED', {
      new: 'COMPLETE',
      old: 'SUBMITTED',
    })
  })
})

test('getInvolvedStaff', async () => {
  const expected = [{ name: 'AAA User' }, { name: 'BBB User' }]
  query.mockReturnValue({ rows: expected })

  const result = await incidentClient.getInvolvedStaff(1)

  expect(result).toEqual([{ name: 'AAA User' }, { name: 'BBB User' }])
  expect(query).toHaveBeenCalledWith({
    text: `select s.id     "statementId"
    ,      s.user_id       "userId"
    ,      s.name          "name"
    ,      s.email         "email"
    from v_statement s 
    where s.report_id = $1`,
    values: [1],
  })
})

test('getNextNotificationReminder', () => {
  incidentClient.getNextNotificationReminder(transactionalQuery)
  expect(transactionalQuery).toHaveBeenCalledWith({
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
              and s.removal_requested_date is null
              order by s.id
              for update of s skip locked
              LIMIT 1`,
    values: [StatementStatus.PENDING.value],
  })
})

test('setNextReminderDate', () => {
  const date = new Date()
  incidentClient.setNextReminderDate(-1, date)

  expect(query).toHaveBeenCalledWith({
    text: 'update v_statement set next_reminder_date = $1, updated_date = now() where id = $2',
    values: [date, -1],
  })
})

test('deleteReport', async () => {
  const date = new Date()
  await incidentClient.deleteReport('USER-1', -1, date)

  expect(transactionalQuery).toHaveBeenCalledWith({
    text: 'update report set deleted = $1 where id = $2',
    values: [date, -1],
  })
  expect(transactionalQuery).toHaveBeenCalledWith({
    text: 'update statement set deleted = $1 where id in (select id from statement where report_id = $2)',
    values: [date, -1],
  })
  expect(transactionalQuery).toHaveBeenCalledWith({
    text: 'update statement_amendments set deleted = $1 where statement_id in (select id from statement where report_id = $2)',
    values: [date, -1],
  })
  expect(reportLogClient.insert).toHaveBeenCalledWith(transactionalQuery, 'USER-1', -1, 'REPORT_DELETED')
})

test('update', () => {
  const date = new Date()

  incidentClient.update(1, date, {})

  expect(query).toHaveBeenCalledWith({
    text: `update v_report r
            set form_response = COALESCE($1,   r.form_response)
            ,   incident_date = COALESCE($2,   r.incident_date)
            ,   updated_date = now()
            where r.id = $3`,
    values: [{}, date, 1],
  })
})
