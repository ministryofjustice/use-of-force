const db = require('./dataAccess/db')

const update = (formId, formResponse) => {
  const query = {
    text: `update form f set form_response = $1 where f.id = $2`,
    values: [formResponse, formId],
  }
  return db.query(query)
}

const create = (userId, bookingId) => {
  const nextSequence = `(select COALESCE(MAX(sequence_no), 0) + 1 from form where booking_id = $3 and user_id = $2)`

  const query = {
    text: `insert into form (form_response, user_id, booking_id, status, sequence_no, start_date)
            values ($1, CAST($2 AS VARCHAR), $3, $4, ${nextSequence}, CURRENT_TIMESTAMP)`,
    values: [{}, userId, bookingId, 'IN_PROGRESS'],
  }
  return db.query(query)
}

module.exports = {
  create,
  update,
  getFormDataForUser(userId, bookingId) {
    const maxSequenceForBooking =
      '(select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id and user_id = f.user_id)'
    const query = {
      text: `select id, form_response from form f
            where user_id = $1
            and booking_id = $2
            and status = 'IN_PROGRESS'
            and f.sequence_no = ${maxSequenceForBooking}`,
      values: [userId, bookingId],
    }

    return db.query(query)
  },
}
