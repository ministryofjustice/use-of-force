import moment from 'moment'

export default function getIncidentDate(savedValue: Date, userProvidedValue) {
  if (userProvidedValue) {
    const {
      date,
      time: { hour, minute },
    } = userProvidedValue
    return { date, hour, minute }
  }

  if (savedValue) {
    const date = moment(savedValue)
    return { date: date.format('DD/MM/YYYY'), hour: date.format('HH'), minute: date.format('mm') }
  }

  return null
}
