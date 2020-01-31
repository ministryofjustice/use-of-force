const moment = require('moment')

const reportingClient = require('./reportingClient')
/** @type {any} */
const db = require('./dataAccess/db')

jest.mock('../../server/data/dataAccess/db')

afterEach(() => {
  db.query.mockReset()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('reportingClient', () => {
  describe('getMostOftenInvolvedStaff', () => {
    test('it should pass om the correct sql', () => {
      const agencyId = 'LEI'
      const startDate = moment()
      const endDate = moment().add(1, 'month')

      reportingClient.getMostOftenInvolvedStaff(agencyId, startDate, endDate)

      expect(db.query).toBeCalledWith({
        text: `select s.name, count(*) 
          from statement s
          join report r on r.id = s.report_id
          where r.agency_id = $1
          and   r.incident_date >= $2
          and   r.incident_date <= $3
          group by s.user_id, s.name
          order by 2 desc
          limit 10`,
        values: [agencyId, startDate.toDate(), endDate.toDate()],
      })
    })
  })

  describe('getMostOftenInvolvedPrisoners', () => {
    test('it should pass om the correct sql', () => {
      const agencyId = 'LEI'
      const startDate = moment()
      const endDate = moment().add(1, 'month')

      reportingClient.getMostOftenInvolvedPrisoners(agencyId, startDate, endDate)

      expect(db.query).toBeCalledWith({
        text: `select r.offender_no "offenderNo", count(*)
          from report r
          where r.agency_id = $1
          and   r.incident_date >= $2
          and   r.incident_date <= $3
          group by offender_no
          order by 2 desc
          limit 10`,
        values: [agencyId, startDate.toDate(), endDate.toDate()],
      })
    })
  })
})
