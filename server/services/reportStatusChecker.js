const { persistent } = require('../config/incident')
const { isValid } = require('./validation')

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

module.exports = {
  SectionStatus,
  check: report => {
    const result = Object.keys(persistent).reduce(
      (previous, key) => ({ ...previous, [key]: getStatus(persistent[key], report[key]) }),
      {}
    )

    const complete = !Object.values(result).some(value => value !== SectionStatus.COMPLETE)
    return { ...result, complete }
  },
}
