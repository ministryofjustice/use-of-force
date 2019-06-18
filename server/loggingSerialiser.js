const bunyan = require('bunyan')
const { getNamespace } = require('cls-hooked')
const uuidv4 = require('uuid/v4')

const redactSession = msg => msg.replace(/session=[A-Za-z0-9=]+/, 'session=REDACTED')

module.exports = {
  err: bunyan.stdSerializers.err,
  req(req) {
    const req1 = bunyan.stdSerializers.req(req)
    if (req1.headers && req1.headers.cookie) {
      req1.headers.cookie = redactSession(req1.headers.cookie)
    }
    const ns = getNamespace('request.scope')
    const correlationId = uuidv4()
    ns.set('correlationId', correlationId)
    req1.correlationId = correlationId
    req1.username = req.user && req.user.username // this has been removed from req1 by the stdSerializer
    return req1
  },
  res(res) {
    const res1 = bunyan.stdSerializers.res(res)
    if (res1.header) {
      res1.header = redactSession(res1.header)
    }
    const ns = getNamespace('request.scope')
    res1.correlationId = ns.get('correlationId')
    res1.username = ns.get('user')
    return res1
  },
}
