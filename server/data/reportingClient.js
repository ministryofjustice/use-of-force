const nonTransactionalClient = require('./dataAccess/db')

const getMostOftenInvolvedStaff = async (agencyId, startDate, endDate) => {
  const results = await nonTransactionalClient.query({
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
  return results.rows
}

const getMostOftenInvolvedPrisoners = async (agencyId, startDate, endDate) => {
  const results = await nonTransactionalClient.query({
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
  return results.rows
}

module.exports = {
  getMostOftenInvolvedStaff,
  getMostOftenInvolvedPrisoners,
}
