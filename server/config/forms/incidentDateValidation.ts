import moment from 'moment'
import joi, { ErrorReport } from '@hapi/joi'
import { addWeeks, endOfDay, isAfter, isValid, isWithinInterval, parse, startOfDay, subDays } from 'date-fns'
import { toInteger } from './sanitisers'
import config from '../../config'

export enum ValidationError {
  missing = 'missing',
  isNotNumber = 'isNotNumber',
  isTooLarge = 'isTooLarge',
  isNot2Digits = 'isNot2Digits',
  isFuture = 'isFuture',
  invalid = 'invalid',
  isNotPositiveNumber = 'isNotPositiveNumber',
  outOfRange = 'outOfRange',
}

export function dateValidation(date: string, helpers: joi.CustomHelpers): ErrorReport | string {
  const trimmedDate = date.trim()

  if (!trimmedDate) {
    return helpers.error(ValidationError.missing)
  }

  const parsedDate = parse(trimmedDate, 'dd/MM/yyyy', new Date())

  if (!isValid(parsedDate)) {
    return helpers.error(ValidationError.invalid)
  }

  const incidentDate = startOfDay(new Date(parsedDate))
  const todayEnd = endOfDay(new Date())

  const submissionWindowEndDate = endOfDay(
    subDays(addWeeks(incidentDate, config.maxWeeksFromIncidentDateToSubmitOrEditReport), 1)
  )

  const isWithinSubmissionWindow = isWithinInterval(todayEnd, {
    start: incidentDate,
    end: submissionWindowEndDate,
  })

  if (!isWithinSubmissionWindow) {
    return helpers.error(ValidationError.outOfRange)
  }

  if (isAfter(parsedDate, startOfDay(new Date()))) {
    return helpers.error(ValidationError.isFuture)
  }

  return date
}

export function timeValidation(time: string, helpers: joi.CustomHelpers): ErrorReport | string {
  const fullDate = helpers.state.ancestors[0].value

  if (fullDate && moment(fullDate).isBetween(moment.now(), moment().endOf('day'), 'seconds')) {
    return helpers.error(ValidationError.isFuture)
  }

  return time
}

export function minuteValidation(minute: string, helpers: joi.CustomHelpers): ErrorReport | string {
  const parsedMinutes = toInteger(minute)

  if (!minute) {
    return helpers.error(ValidationError.missing)
  }

  if (parsedMinutes === null) {
    return helpers.error(ValidationError.isNotNumber)
  }

  if (parsedMinutes < 0) {
    return helpers.error(ValidationError.isNotPositiveNumber)
  }

  if (parsedMinutes >= 60) {
    return helpers.error(ValidationError.isTooLarge)
  }

  if (minute.length !== 2) {
    return helpers.error(ValidationError.isNot2Digits)
  }
  return minute
}

export function hourValidation(hour: string, helpers: joi.CustomHelpers): ErrorReport | string {
  const parsedHours = toInteger(hour)

  if (!hour) {
    return helpers.error(ValidationError.missing)
  }

  if (parsedHours === null) {
    return helpers.error(ValidationError.isNotNumber)
  }

  if (parsedHours < 0) {
    return helpers.error(ValidationError.isNotPositiveNumber)
  }

  if (parsedHours >= 24) {
    return helpers.error(ValidationError.isTooLarge)
  }

  if (hour.length !== 2) {
    return helpers.error(ValidationError.isNot2Digits)
  }

  return hour
}
