const format = require('pg-format')
const db = require('./dataAccess/db')

const createDraftIncident = async ({ userId, bookingId, reporterName, offenderNo, incidentDate, formResponse }) => {
  const nextSequence = `(select COALESCE(MAX(sequence_no), 0) + 1 from incidents where booking_id = $5 and user_id = $2)`
  const result = await db.query({
    text: `insert into incidents (form_response, user_id, reporter_name, offender_no, booking_id, status, incident_date, sequence_no, created_date)
            values ($1, CAST($2 AS VARCHAR), $3, $4, $5, $6, $7, ${nextSequence}, CURRENT_TIMESTAMP)
            returning id`,
    values: [formResponse, userId, reporterName, offenderNo, bookingId, 'IN_PROGRESS', incidentDate],
  })
  return result.rows[0].id
}

const updateDraftIncident = (incidentId, incidentDate, formResponse) => {
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

const getCurrentDraftIncident = async (userId, bookingId, query = db.query) => {
  const results = await query({
    text: `select id, incident_date, form_response from incidents i
          where user_id = $1
          and booking_id = $2
          and status = 'IN_PROGRESS'
          and i.sequence_no = ${maxSequenceForBooking}`,
    values: [userId, bookingId],
  })
  return results.rows[0] || {}
}

const getIncidentsForUser = (userId, status, query = db.query) => {
  return query({
    text: `select i.id, i.booking_id, i.reporter_name, i.offender_no, i.incident_date, inv.id, inv."name"
            from involved_staff inv 
            inner join incidents i on inv.incident_id = i.id   
          where i.status = $1 
          and inv.user_id = $2 
          and inv.statement_status = $3`,
    values: ['SUBMITTED', userId, 'PENDING'],
  })
}

const getInvolvedStaff = async (incidentId, query = db.query) => {
  const results = await query({
    text: 'select id, user_id, name, email from involved_staff where incident_id = $1',
    values: [incidentId],
  })
  return results.rows
}

const deleteInvolvedStaff = incidentId => {
  return db.query({
    text: `delete from involved_staff where incident_id = $1`,
    values: [incidentId],
  })
}

const insertInvolvedStaff = async (incidentId, staff) => {
  const rows = staff.map(s => [incidentId, s.userId, s.name, 'PENDING'])
  const results = await db.query({
    text: format(
      'insert into involved_staff (incident_id, user_id, name, statement_status) VALUES %L returning id',
      rows
    ),
  })
  return results.rows.map(row => row.id)
}

module.exports = {
  createDraftIncident,
  updateDraftIncident,
  submit,
  getCurrentDraftIncident,
  getIncidentsForUser,
  getInvolvedStaff,
  deleteInvolvedStaff,
  insertInvolvedStaff,
}
