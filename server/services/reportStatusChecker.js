const config = require('../config/incident')

const SectionStatus = Object.freeze({
  NOT_STARTED: 'not_started',
  INCOMPLETE: 'incomplete',
  COMPLETE: 'complete',
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
    return Object.keys(config).reduce((previous, key) => {
      return { ...previous, [key]: getStatus(config[key], report[key]) }
    }, {})
  },
}
