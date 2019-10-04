const config = require('../config/incident')

const SectionStatus = Object.freeze({
  NOT_STARTED: 'NOT_STARTED',
  INCOMPLETE: 'INCOMPLETE',
  COMPLETE: 'COMPLETE',
})

const getStatus = (fieldConfig, sectionValues) => {
  if (!sectionValues) {
    return SectionStatus.NOT_STARTED
  }

  return fieldConfig.isComplete(sectionValues) ? SectionStatus.COMPLETE : SectionStatus.INCOMPLETE
}

module.exports = {
  SectionStatus,
  check: report => {
    const result = Object.keys(config).reduce(
      (previous, key) => ({ ...previous, [key]: getStatus(config[key], report[key]) }),
      {}
    )

    const complete = !Object.values(result).some(value => value !== SectionStatus.COMPLETE)
    return { ...result, complete }
  },
}
