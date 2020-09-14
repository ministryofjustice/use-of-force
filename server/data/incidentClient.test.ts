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

describe('getCurrentDraftReport', () => {
  test('it should call query on db', () => {
    incidentClient.getCurrentDraftReport('user1', 1)
    expect(query).toBeCalledTimes(1)
  })

  test('it should pass om the correct sql', () => {
    incidentClient.getCurrentDraftReport('user1', -1)

    expect(query).toBeCalledWith({
      text: `select id, incident_date "incidentDate", form_response "form", agency_id "agencyId" from v_report r
          where r.user_id = $1
          and r.booking_id = $2
          and r.status = $3
          and r.sequence_no = (select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)`,
      values: ['user1', -1, ReportStatus.IN_PROGRESS.value],
    })
  })
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
  incidentClient.getReportForReviewer('report1')

  expect(query).toBeCalledWith({
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
    values: ['report1'],
  })
})

test('getIncompleteReportsForReviewer', () => {
  const isOverdue = `(select count(*) from "v_statement" s
                      where r.id = s.report_id 
                      and s.statement_status = $3
                      and s.overdue_date <= now()) > 0`

  incidentClient.getIncompleteReportsForReviewer('agency-1')

  expect(query).toBeCalledWith({
    text: `select r.id
            , r.booking_id     "bookingId"
            , r.reporter_name  "reporterName"
            , r.offender_no    "offenderNo"
            , r.incident_date  "incidentDate"
            , ${isOverdue}     "isOverdue"
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

test('createDraftReport', async () => {
  query.mockReturnValue({ rows: [{ id: 1 }] })

  const id = await incidentClient.createDraftReport({
    userId: 'user1',
    bookingId: 'booking-1',
    agencyId: 'LEI',
    reporterName: 'Bob Smith',
    offenderNo: 'AA11ABC',
    incidentDate: 'date-1',
    formResponse: { someData: true },
  })

  expect(id).toEqual(id)
  expect(query).toBeCalledWith({
    text: `insert into report (form_response, user_id, reporter_name, offender_no, booking_id, agency_id, status, incident_date, sequence_no, created_date)
              values ($1, CAST($2 AS VARCHAR), $3, $4, $5, $6, $7, $8, (select COALESCE(MAX(sequence_no), 0) + 1 from v_report where booking_id = $5 and user_id = $2), CURRENT_TIMESTAMP)
              returning id`,
    values: [
      { someData: true },
      'user1',
      'Bob Smith',
      'AA11ABC',
      'booking-1',
      'LEI',
      ReportStatus.IN_PROGRESS.value,
      'date-1',
    ],
  })
})

test('updateDraftReport', () => {
  incidentClient.updateDraftReport('formId', 'date-1', {})

  expect(query).toBeCalledWith({
    text: `update v_report r
            set form_response = COALESCE($1,   r.form_response)
            ,   incident_date = COALESCE($2,   r.incident_date)
            ,   updated_date = now()
            where r.id = $3`,
    values: [{}, 'date-1', 'formId'],
  })
})

test('updateAgencyId', () => {
  incidentClient.updateAgencyId('agencyId', 'username', 'bookingId')

  expect(query).toBeCalledWith({
    text: `update v_report r
                  set agency_id = COALESCE($1,   r.agency_id)
                  ,   form_response = jsonb_set(form_Response, '{incidentDetails,locationId}', 'null'::jsonb)
                  where r.user_id = $2
                  and r.booking_id = $3
                  and r.sequence_no = (select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)`,
    values: ['agencyId', 'username', 'bookingId'],
  })
})

test('submitReport', () => {
  const date = new Date()
  incidentClient.submitReport('user1', 1, date)

  expect(query).toBeCalledWith({
    text: `update v_report r
            set status = $1
            ,   submitted_date = $2
            ,   updated_date = now()
          where r.user_id = $3
          and r.booking_id = $4
          and r.status = $5
          and r.sequence_no = (select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)`,
    values: [ReportStatus.SUBMITTED.value, date, 'user1', 1, ReportStatus.IN_PROGRESS.value],
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

test('getDraftInvolvedStaff', async () => {
  const expected = [
    {
      form: {
        incidentDetails: {
          involvedStaff: [
            {
              name: 'AAA User',
            },
            {
              name: 'BBB User',
            },
          ],
        },
      },
    },
  ]
  query.mockReturnValue({ rows: expected })

  const result = await incidentClient.getDraftInvolvedStaff(1)

  expect(result).toEqual([{ name: 'AAA User' }, { name: 'BBB User' }])
  expect(query).toBeCalledWith({
    text: `select form_response "form" from v_report where id = $1`,
    values: [1],
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
  incidentClient.setNextReminderDate(-1, '2019-09-03 11:20:36')

  expect(query).toBeCalledWith({
    text: 'update v_statement set next_reminder_date = $1, updated_date = now() where id = $2',
    values: ['2019-09-03 11:20:36', -1],
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
