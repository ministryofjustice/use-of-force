import bunyan from 'bunyan'
import bunyanFormat from 'bunyan-format'
import serializers from './server/loggingSerialiser'

const formatOut = bunyanFormat({ outputMode: 'json', color: true })

export = bunyan.createLogger({
  name: 'Use of Force',
  stream: formatOut,
  level: 'debug',
  serializers,
})
