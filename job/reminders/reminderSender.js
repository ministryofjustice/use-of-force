const logger = require('../../log')

// TODO['DCS-93'] complete processor
module.exports = () => reminder => {
  logger.info('processing reminder', reminder)
}
