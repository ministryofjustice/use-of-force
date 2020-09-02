import moment from 'moment'

const validOrNull = val => (Number.isNaN(val) ? null : val)

export const toInteger = (val?: string): number | null => {
  return /[0-9]$/.test(val) ? validOrNull(parseInt(val, 10)) : null
}

const toDateTime = (date: moment.Moment, hours?: number, minutes?: number): moment.Moment | null => {
  const validHours = hours != null && hours >= 0 && hours < 24
  const validMinutes = minutes != null && minutes >= 0 && minutes < 60

  if (!date.isValid() || !validHours || !validMinutes) {
    return null
  }
  const fullDate = moment(date)
  fullDate.set({ hours, minutes })
  return fullDate
}

type DateParameter = {
  date: string
  time: {
    hour: string
    minute: string
  }
}

export const toDate = ({ date: dateVal = '', time: { hour = '', minute = '' } }: DateParameter) => {
  const parsedDate = moment(dateVal.trim(), 'DD/MM/YYYY', true)
  const parsedHours = toInteger(hour)
  const parsedMinutes = toInteger(minute)

  const fullDate = toDateTime(parsedDate, parsedHours, parsedMinutes)

  return {
    date: dateVal,
    time: { hour, minute },
    value: fullDate ? fullDate.toDate() : null,
  }
}
