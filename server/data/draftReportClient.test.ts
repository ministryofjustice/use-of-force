import DraftReportClient from './draftReportClient'
import { ReportStatus } from '../config/types'

let draftReportClient: DraftReportClient
const query = jest.fn()
const inTransaction = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
  draftReportClient = new DraftReportClient(query, inTransaction)
  query.mockResolvedValue({ rows: [] })
})

describe('get', () => {
  test('it should call query on db', () => {
    draftReportClient.get('user1', 1)
    expect(query).toBeCalledTimes(1)
  })

  test('it should pass om the correct sql', () => {
    draftReportClient.get('user1', -1)

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

test('create', async () => {
  query.mockReturnValue({ rows: [{ id: 1 }] })

  const id = await draftReportClient.create({
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

test('update', () => {
  const date = new Date()

  draftReportClient.update(1, date, {})

  expect(query).toBeCalledWith({
    text: `update v_report r
            set form_response = COALESCE($1,   r.form_response)
            ,   incident_date = COALESCE($2,   r.incident_date)
            ,   updated_date = now()
            where r.id = $3`,
    values: [{}, date, 1],
  })
})

test('updateAgencyId', () => {
  draftReportClient.updateAgencyId('agencyId', 'username', 1)

  expect(query).toBeCalledWith({
    text: `update v_report r
                  set agency_id = COALESCE($1,   r.agency_id)
                  ,   form_response = jsonb_set(form_Response, '{incidentDetails,locationId}', 'null'::jsonb)
                  where r.user_id = $2
                  and r.booking_id = $3
                  and r.sequence_no = (select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)`,
    values: ['agencyId', 'username', 1],
  })
})

test('submit', () => {
  const date = new Date()
  draftReportClient.submit('user1', 1, date)

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

test('getInvolvedStaff', async () => {
  const expected = [
    {
      form: {
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
  ]
  query.mockReturnValue({ rows: expected })

  const result = await draftReportClient.getInvolvedStaff('user-1', 1)

  expect(result).toEqual([{ name: 'AAA User' }, { name: 'BBB User' }])
  expect(query).toBeCalledWith({
    text: `select form_response "form" from v_report where booking_id = $1 and user_id = $2 and status = $3`,
    values: [1, 'user-1', ReportStatus.IN_PROGRESS.value],
  })
})
