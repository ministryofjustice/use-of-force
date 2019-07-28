const db = require('./dataAccess/db')

const create = ({ userId, bookingId, reporterName, offenderNo, incidentDate, formResponse }) => {
  const nextSequence = `(select COALESCE(MAX(sequence_no), 0) + 1 from incidents where booking_id = $5 and user_id = $2)`
  const result = db.query({
    text: `insert into incidents (form_response, user_id, reporter_name, offender_no, booking_id, status, incident_date, sequence_no, created_date)
            values ($1, CAST($2 AS VARCHAR), $3, $4, $5, $6, $7, ${nextSequence}, CURRENT_TIMESTAMP)
            returning id`,
    values: [formResponse, userId, reporterName, offenderNo, bookingId, 'IN_PROGRESS', incidentDate],
  })
  return result.rows[0].id
}

const update = (incidentId, incidentDate, formResponse) => {
  return db.query({
    text: `update incidents i set form_response = $1, incident_date = COALESCE($2, i.incident_date) where i.id = $3`,
    values: [formResponse, incidentDate, incidentId],
  })
}

const maxSequenceForBooking =
  '(select max(i2.sequence_no) from incidents i2 where i2.booking_id = i.booking_id and user_id = i.user_id)'

const submit = (userId, bookingId) => {
  return db.query({
    text: `update incidents i set status = $1, submitted_date = CURRENT_TIMESTAMP 
    where user_id = $2
    and booking_id = $3
    and status = 'IN_PROGRESS'
    and i.sequence_no = ${maxSequenceForBooking}`,
    values: ['SUBMITTED', userId, bookingId],
  })
}

const getFormDataForUser = (userId, bookingId, query = db.query) => {
  return query({
    text: `select id, incident_date, form_response from incidents i
          where user_id = $1
          and booking_id = $2
          and status = 'IN_PROGRESS'
          and i.sequence_no = ${maxSequenceForBooking}`,
    values: [userId, bookingId],
  })
}

const getIncidentsForUser = (userId, status, query = db.query) => {
  return query({
    text: `select id, booking_id, reporter_name, offender_no, incident_date
          from incidents
          where (user_id = $1 or form_response -> 'incident' -> 'newIncident' -> 'involved'  @> $2)
          and status = $3`,
    values: [userId, JSON.stringify([{ name: userId }]), status],
  })
}

module.exports = {
  create,
  update,
  submit,
  getFormDataForUser,
  getIncidentsForUser,
}
