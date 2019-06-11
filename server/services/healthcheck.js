const { dbCheck, authCheck } = require('../data/healthcheck')

function db() {
  return dbCheck()
    .then(() => ({ name: 'db', status: 'ok', message: 'OK' }))
    .catch(err => ({ name: 'db', status: 'ERROR', message: err.message }))
}

function auth() {
  return authCheck()
    .then(result => ({ name: 'auth', status: 'ok', message: result }))
    .catch(err => ({ name: 'auth', status: 'ERROR', message: err }))
}

module.exports = function healthcheck(callback) {
  const checks = [db, auth]

  return Promise.all(checks.map(fn => fn())).then(checkResults => {
    const allOk = checkResults.every(item => item.status === 'ok')
    const result = {
      healthy: allOk,
      checks: checkResults.reduce(gatherCheckInfo, {}),
    }
    callback(null, addAppInfo(result))
  })
}

function gatherCheckInfo(total, currentValue) {
  return Object.assign({}, total, { [currentValue.name]: currentValue.message })
}

function addAppInfo(result) {
  const buildInformation = getBuild()
  const buildInfo = {
    uptime: process.uptime(),
    build: buildInformation,
    version: buildInformation && buildInformation.buildNumber,
  }

  return Object.assign({}, result, buildInfo)
}

function getBuild() {
  try {
    // eslint-disable-next-line import/no-unresolved,global-require
    return require('../../build-info.json')
  } catch (ex) {
    return null
  }
}
