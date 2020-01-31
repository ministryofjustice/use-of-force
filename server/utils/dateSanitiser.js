const moment = require('moment')

const validOrNull = val => (Number.isNaN(val) ? null : val)

const toInteger = val => {
  const number = parseInt(val, 10)
  return validOrNull(number)
}

const toDate = ({ date, months, years }) =>
  date && months && years
    ? moment({
        years,
        months: months - 1,
        date,
      })
    : null

const toDateTime = ({ minutes, hours, date, months, years }) => {
  const allPresent = [minutes, hours, date, months, years].every(number => Number.isInteger(number))
  return allPresent
    ? moment({
        years,
        months: months - 1,
        date,
        hours,
        minutes,
      })
    : null
}

module.exports = ({ date: { day = null, month = null, year = null } = {}, time = null } = {}, now = moment()) => {
  const trimmedTime = time && time.trim()
  const parsedTime = moment(trimmedTime, ['HH.mm', 'HH:mm'], true)
  const hours = validOrNull(parsedTime.hours())
  const minutes = validOrNull(parsedTime.minutes())

  const date = toInteger(day)
  const months = toInteger(month)
  const years = toInteger(year)

  const dateOnly = toDate({ date, months, years })
  const fullDate = toDateTime({ minutes, hours, date, months, years })

  const isFutureDate = Boolean(dateOnly) && dateOnly.isAfter(moment().startOf('day'))
  const isFutureDateTime =
    Boolean(dateOnly) && dateOnly.isSame(moment().startOf('day')) && Boolean(fullDate) && fullDate.isAfter(now)

  const isInvalidDate = Boolean(dateOnly) && !dateOnly.isValid()
  const isInvalidDateTime = Boolean(fullDate) && !fullDate.isValid()

  return {
    date: {
      day: date,
      month: months,
      year: years,
    },
    time: trimmedTime,
    raw: { day, month, year, time: trimmedTime },
    value: fullDate && fullDate.isValid() ? fullDate.toDate() : null,
    isInvalidDate: isInvalidDate || isInvalidDateTime,
    isFutureDate, // entered date is at least tomorrow
    isFutureDateTime, // only a greater date than now due to time
  }
}
