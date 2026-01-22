import moment from 'moment'
import { DateTime } from '../config/edit/incidentDetailsConfig'

export default function getIncidentDate(savedValue: Date, userProvidedValue): DateTime | null {
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
