const moment = require('moment')

const reportingClient = require('./reportingClient')
const db = require('./dataAccess/db')

jest.mock('../../server/data/dataAccess/db')

afterEach(() => {
  db.query.mockReset()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getMostOftenInvolvedStaff', () => {
  test('it should pass om the correct sql', () => {
    const agencyId = 'LEI'
    const startDate = moment()
    const endDate = moment().add(1, 'month')

    reportingClient.getMostOftenInvolvedStaff(agencyId, startDate, endDate)

    expect(db.query).toBeCalledWith({
      text: `select s.user_id "userId", s.name, count(*) 
          from statement s
          join report r on r.id = s.report_id
          where r.agency_id = $1
          and r.incident_date >= $2
          and r.incident_date <= $3
          group by s.user_id, s.name
          order by 3 desc
          limit 10`,
      values: [agencyId, startDate.toDate(), endDate.toDate()],
    })
  })
})
