const nonTransactionalClient = require('./dataAccess/db')

const getMostOftenInvolvedStaff = async (agencyId, startDate, endDate) => {
  const results = await nonTransactionalClient.query({
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
  return results.rows
}

module.exports = {
  getMostOftenInvolvedStaff,
}
