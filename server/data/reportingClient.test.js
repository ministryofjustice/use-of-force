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

      reportingClient.getMostOftenInvolvedStaff(agencyId, [startDate, endDate])

      expect(db.query).toBeCalledWith({
        text: `select s.name, count(*) 
          from statement s
          join report r on r.id = s.report_id
          where r.agency_id = $1
          and   r.incident_date >= $2
          and   r.incident_date <= $3
          and   s.deleted is null
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

      reportingClient.getMostOftenInvolvedPrisoners(agencyId, [startDate, endDate])

      expect(db.query).toBeCalledWith({
        text: `select r.offender_no "offenderNo", count(*)
          from v_report r
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

  describe('getIncidentsOverview', () => {
    test('it should pass om the correct sql', () => {
      const agencyId = 'LEI'
      const startDate = moment('2012-01-02 01:03')
      const endDate = moment(startDate).add(1, 'month')

      reportingClient.getIncidentsOverview(agencyId, [startDate, endDate], ['IN_PROGRESS', 'COMPLETE'])

      expect(db.query).toBeCalledWith({
        text: `
      select
        count(*) "total",
        count(*) filter (where (incidentDetails ->> 'plannedUseOfForce')::boolean = true) "planned",
        count(*) filter (where (incidentDetails ->> 'plannedUseOfForce')::boolean = false) "unplanned",
        count(*) filter (where (useOfForceDetails ->> 'handcuffsApplied')::boolean = true) "handcuffsApplied",
        count(*) filter (where (useOfForceDetails ->> 'batonDrawn')::boolean = true) "batonDrawn",
        count(*) filter (where (useOfForceDetails ->> 'batonUsed')::boolean = true) "batonUsed",
        count(*) filter (where (useOfForceDetails ->> 'pavaDrawn')::boolean = true) "pavaDrawn",
        count(*) filter (where (useOfForceDetails ->> 'pavaUsed')::boolean = true) "pavaUsed",
        count(*) filter (where (useOfForceDetails ->> 'personalProtectionTechniques')::boolean = true) "personalProtectionTechniques",
        count(*) filter (where evidence ->> 'cctvRecording' = 'YES') "cctvRecording",
        count(*) filter (where evidence ->> 'bodyWornCamera' = 'YES') "bodyWornCamera",
        count(*) filter (where evidence ->> 'bodyWornCamera' = 'NOT_KNOWN') "bodyWornCameraUnknown"
      from
        (
        select
          form_response  -> 'incidentDetails'   incidentDetails,
          form_response  -> 'useOfForceDetails' useOfForceDetails,
          form_response  -> 'evidence'          evidence
        from
          v_report
        where
          status in ('IN_PROGRESS','COMPLETE')
          and agency_id = 'LEI'
          and incident_date between '2012-01-02 01:03:00.000+00' and '2012-02-02 01:03:00.000+00') incidents`,
      })
    })
  })
})
