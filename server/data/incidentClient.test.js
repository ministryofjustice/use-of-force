const incidentClient = require('./incidentClient')
const db = require('./dataAccess/db')
const { ReportStatus, StatementStatus } = require('../config/types')

jest.mock('../../server/data/dataAccess/db')

afterEach(() => {
  db.query.mockReset()
})

describe('getCurrentDraftReport', () => {
  test('it should call query on db', () => {
    incidentClient.getCurrentDraftReport('user1')
    expect(db.query).toBeCalledTimes(1)
  })

  test('it should pass om the correct sql', () => {
    incidentClient.getCurrentDraftReport('user1', -1)

    expect(db.query).toBeCalledWith({
      text: `select id, incident_date "incidentDate", form_response "form" from report r
          where r.user_id = $1
          and r.booking_id = $2
          and r.status = $3
          and r.sequence_no = (select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)`,
      values: ['user1', -1, ReportStatus.IN_PROGRESS.value],
    })
  })
})

test('getReports', () => {
  incidentClient.getReports('user1', [ReportStatus.IN_PROGRESS, ReportStatus.SUBMITTED])

  expect(db.query).toBeCalledWith({
    text: `select r.id
            , r.booking_id    "bookingId"
            , r.reporter_name "reporterName"
            , r.offender_no   "offenderNo"
            , r.incident_date "incidentDate"
            from report r
          where r.status in ('IN_PROGRESS','SUBMITTED')
          and r.user_id = 'user1'
          order by r.incident_date`,
  })
})

test('getReportForReviewer', () => {
  incidentClient.getReportForReviewer('report1')

  expect(db.query).toBeCalledWith({
    text: `select id
          , incident_date "incidentDate"
          , submitted_date "submittedDate"
          , reporter_name "reporterName"
          , form_response "form"
          , booking_id "bookingId"
          from report r
          where r.id = $1`,
    values: ['report1'],
  })
})

test('getIncompleteReportsForReviewer', () => {
  const isOverdue = `(select count(*) from "statement" s
                      where r.id = s.report_id 
                      and s.statement_status = $3
                      and s.overdue_date <= now()) > 0`

  incidentClient.getIncompleteReportsForReviewer('agency-1')

  expect(db.query).toBeCalledWith({
    text: `select r.id
            , r.booking_id     "bookingId"
            , r.reporter_name  "reporterName"
            , r.offender_no    "offenderNo"
            , r.incident_date  "incidentDate"
            , ${isOverdue}     "isOverdue"
            from report r
          where r.status = $1
          and   r.agency_id = $2
          order by r.incident_date`,
    values: [ReportStatus.SUBMITTED.value, 'agency-1', StatementStatus.PENDING.value],
  })
})

test('getCompletedReportsForReviewer', () => {
  incidentClient.getCompletedReportsForReviewer('agency-1')

  expect(db.query).toBeCalledWith({
    text: `select r.id
            , r.booking_id     "bookingId"
            , r.reporter_name  "reporterName"
            , r.offender_no    "offenderNo"
            , r.incident_date  "incidentDate"
            from report r
          where r.status = $1
          and   r.agency_id = $2
          order by r.incident_date`,
    values: [ReportStatus.COMPLETE.value, 'agency-1'],
  })
})

test('getReport', () => {
  incidentClient.getReport('user1', 'report1')

  expect(db.query).toBeCalledWith({
    text: `select id
          , incident_date "incidentDate"
          , submitted_date "submittedDate"
          , reporter_name "reporterName"
          , form_response "form"
          , booking_id "bookingId"
          from report r
          where r.user_id = $1 and r.id = $2`,
    values: ['user1', 'report1'],
  })
})

test('createDraftReport', async () => {
  db.query.mockReturnValue({ rows: [{ id: 1 }] })

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
  expect(db.query).toBeCalledWith({
    text: `insert into report (form_response, user_id, reporter_name, offender_no, booking_id, agency_id, status, incident_date, sequence_no, created_date)
            values ($1, CAST($2 AS VARCHAR), $3, $4, $5, $6, $7, $8, (select COALESCE(MAX(sequence_no), 0) + 1 from report where booking_id = $5 and user_id = $2), CURRENT_TIMESTAMP)
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

  expect(db.query).toBeCalledWith({
    text: `update report r
            set form_response = COALESCE($1,   r.form_response)
            ,   incident_date = COALESCE($2,   r.incident_date)
            ,   updated_date = now()
            where r.id = $3`,
    values: [{}, 'date-1', 'formId'],
  })
})

test('submitReport', () => {
  incidentClient.submitReport('user1', 'booking1', 'date1')

  expect(db.query).toBeCalledWith({
    text: `update report r
            set status = $1
            ,   submitted_date = $2
            ,   updated_date = now()
          where r.user_id = $3
          and r.booking_id = $4
          and r.status = $5
          and r.sequence_no = (select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)`,
    values: [ReportStatus.SUBMITTED.value, 'date1', 'user1', 'booking1', ReportStatus.IN_PROGRESS.value],
  })
})

test('markCompleted', () => {
  incidentClient.markCompleted('report1')

  expect(db.query).toBeCalledWith({
    text: `update report r
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
  db.query.mockReturnValue({ rows: expected })

  const result = await incidentClient.getDraftInvolvedStaff('incident-1')

  expect(result).toEqual([{ name: 'AAA User' }, { name: 'BBB User' }])
  expect(db.query).toBeCalledWith({
    text: `select form_response "form" from report where id = $1`,
    values: ['incident-1'],
  })
})

test('getInvolvedStaff', async () => {
  const expected = [{ name: 'AAA User' }, { name: 'BBB User' }]
  db.query.mockReturnValue({ rows: expected })

  const result = await incidentClient.getInvolvedStaff('incident-1')

  expect(result).toEqual([{ name: 'AAA User' }, { name: 'BBB User' }])
  expect(db.query).toBeCalledWith({
    text: `select s.id     "statementId"
    ,      s.user_id       "userId"
    ,      s.name          "name"
    ,      s.email         "email"
    from statement s 
    where s.report_id = $1`,
    values: ['incident-1'],
  })
})

test('getNextNotificationReminder', () => {
  incidentClient.getNextNotificationReminder()

  expect(db.query).toBeCalledWith({
    text: `select s.id                     "statementId"
          ,       r.id                     "reportId"
          ,       s.email                  "recipientEmail" 
          ,       s.name                   "recipientName"
          ,       s.next_reminder_date     "nextReminderDate"  
          ,       s.submitted_date         "submittedDate"
          ,       r.reporter_name          "reporterName"
          ,       r.incident_date          "incidentDate"
          ,       r.user_id = s.user_id    "isReporter"
          ,       s.overdue_date           "overdueDate"
          ,       s.overdue_date <= now()  "isOverdue"
          from statement s
          left join report r on r.id = s.report_id
          where s.next_reminder_date < now() and s.statement_status = $1
          order by s.id
          for update of s skip locked
          LIMIT 1`,
    values: [StatementStatus.PENDING.value],
  })
})

test('setNextReminderDate', () => {
  incidentClient.setNextReminderDate(-1, '2019-09-03 11:20:36')

  expect(db.query).toBeCalledWith({
    text: 'update statement set next_reminder_date = $1, updated_date = now() where id = $2',
    values: ['2019-09-03 11:20:36', -1],
  })
})
