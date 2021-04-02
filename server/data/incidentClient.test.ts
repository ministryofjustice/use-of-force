import moment from 'moment'
import IncidentClient from './incidentClient'
import { ReportStatus, StatementStatus } from '../config/types'
import { PageResponse } from '../utils/page'

let incidentClient: IncidentClient
const query = jest.fn()
const inTransaction = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
  incidentClient = new IncidentClient(query, inTransaction)
  query.mockResolvedValue({ rows: [] })
})

test('getReports', async () => {
  const results = await incidentClient.getReports('user1', 1)

  expect(results).toStrictEqual(new PageResponse({ max: 0, min: 0, page: 1, totalCount: 0, totalPages: 0 }, []))

  expect(query).toBeCalledWith({
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

test('getReportForReviewer', () => {
  incidentClient.getReportForReviewer(1)

  expect(query).toBeCalledWith({
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
                      and (s.statement_status = $3 or s.statement_status = $4)
                      and s.overdue_date <= now()) > 0`

  const isRemovalRequested = `(select count(*) from "v_statement" s
                      where r.id = s.report_id
                      and s.statement_status = $4) > 0`

  incidentClient.getIncompleteReportsForReviewer('agency-1')

  expect(query).toBeCalledWith({
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
      'agency-1',
      StatementStatus.PENDING.value,
      StatementStatus.REMOVAL_REQUESTED.value,
    ],
  })
})

test('getAllCompletedReportsForReviewer', () => {
  incidentClient.getAllCompletedReportsForReviewer('agency-1', {
    prisonNumber: 'A1234AB',
    reporter: 'reporter',
    dateFrom: moment('2020-01-29'),
    dateTo: moment('2020-01-30'),
  })

  expect(query).toBeCalledWith({
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

  expect(query).toBeCalledWith({
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

  expect(query).toBeCalledWith({
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
    values: ['user1', 1],
  })
})

test('getAnonReportSummary', () => {
  incidentClient.getAnonReportSummary(1)

  expect(query).toBeCalledWith({
    text: `select vs.id "statementId"
            ,  vr.incident_date "incidentDate"
            ,  vr.agency_id "agencyId"
            from v_statement vs
            join v_report vr on vs.report_id = vr.id
            where vs.id = $1`,
    values: [1],
  })
})

test('changeStatus', () => {
  incidentClient.changeStatus('report1', ReportStatus.SUBMITTED, ReportStatus.COMPLETE)

  expect(query).toBeCalledWith({
    text: `update v_report r
            set status = $1
            ,   updated_date = now()
          where id = $2
          and status = $3`,
    values: [ReportStatus.COMPLETE.value, 'report1', ReportStatus.SUBMITTED.value],
  })
})

test('getInvolvedStaff', async () => {
  const expected = [{ name: 'AAA User' }, { name: 'BBB User' }]
  query.mockReturnValue({ rows: expected })

  const result = await incidentClient.getInvolvedStaff(1)

  expect(result).toEqual([{ name: 'AAA User' }, { name: 'BBB User' }])
  expect(query).toBeCalledWith({
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
  incidentClient.getNextNotificationReminder(query)
  expect(query).toBeCalledWith({
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
})

test('setNextReminderDate', () => {
  const date = new Date()
  incidentClient.setNextReminderDate(-1, date)

  expect(query).toBeCalledWith({
    text: 'update v_statement set next_reminder_date = $1, updated_date = now() where id = $2',
    values: [date, -1],
  })
})

test('deleteReport', async () => {
  inTransaction.mockImplementation(callback => callback(query))

  const date = new Date()
  await incidentClient.deleteReport(-1, date)

  expect(query).toBeCalledWith({
    text: 'update report set deleted = $1 where id = $2',
    values: [date, -1],
  })
  expect(query).toBeCalledWith({
    text: 'update statement set deleted = $1 where id in (select id from statement where report_id = $2)',
    values: [date, -1],
  })
  expect(query).toBeCalledWith({
    text:
      'update statement_amendments set deleted = $1 where statement_id in (select id from statement where report_id = $2)',
    values: [date, -1],
  })
})
