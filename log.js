const bunyan = require('bunyan')
const bunyanFormat = require('bunyan-format')

const formatOut = bunyanFormat({ outputMode: 'short', color: true })

const log = bunyan.createLogger({ name: 'Use of Force', stream: formatOut, level: 'debug' })

module.exports = log
