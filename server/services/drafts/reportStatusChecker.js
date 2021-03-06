const { full } = require('../../config/incident')
const { isValid } = require('../validation')

const SectionStatus = Object.freeze({
  NOT_STARTED: 'NOT_STARTED',
  INCOMPLETE: 'INCOMPLETE',
  COMPLETE: 'COMPLETE',
})

const getStatus = (validationSpec, sectionValues) => {
  if (!sectionValues) {
    return SectionStatus.NOT_STARTED
  }

  return isValid(validationSpec.schema, sectionValues) ? SectionStatus.COMPLETE : SectionStatus.INCOMPLETE
}

const check = report => {
  const result = Object.keys(full).reduce(
    (previous, key) => ({ ...previous, [key]: getStatus(full[key], report[key]) }),
    {}
  )

  const complete = !Object.values(result).some(value => value !== SectionStatus.COMPLETE)
  return { ...result, complete }
}

module.exports = {
  SectionStatus,
  check,
  isReportComplete: report => check(report).complete,
}
