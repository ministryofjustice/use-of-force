const db = require('./dataAccess/db')

const create = ({ userId, bookingId, reporterName, offenderNo, formResponse }) => {
  const nextSequence = `(select COALESCE(MAX(sequence_no), 0) + 1 from form where booking_id = $5 and user_id = $2)`
  return db.query({
    text: `insert into form (form_response, user_id, reporter_name, offender_no, booking_id, status, sequence_no, start_date)
            values ($1, CAST($2 AS VARCHAR), $3, $4, $5, $6, ${nextSequence}, CURRENT_TIMESTAMP)`,
    values: [formResponse, userId, reporterName, offenderNo, bookingId, 'IN_PROGRESS'],
  })
}

const update = (formId, formResponse) => {
  return db.query({
    text: `update form f set form_response = $1 where f.id = $2`,
    values: [formResponse, formId],
  })
}

const maxSequenceForBooking =
  '(select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id and user_id = f.user_id)'

const submit = (userId, bookingId) => {
  return db.query({
    text: `update form f set status = $1, submitted_date = CURRENT_TIMESTAMP 
    where user_id = $2
    and booking_id = $3
    and status = 'IN_PROGRESS'
    and f.sequence_no = ${maxSequenceForBooking}`,
    values: ['SUBMITTED', userId, bookingId],
  })
}

const getFormDataForUser = (userId, bookingId, query = db.query) => {
  return query({
    text: `select id, form_response from form f
          where user_id = $1
          and booking_id = $2
          and status = 'IN_PROGRESS'
          and f.sequence_no = ${maxSequenceForBooking}`,
    values: [userId, bookingId],
  })
}

const getIncidentsForUser = (userId, status, query = db.query) => {
  return query({
    text: `select id, booking_id, user_id, form_response -> 'incident' -> 'newIncident' -> 'incidentDate' incident_date
          from form
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
