/* eslint-disable @typescript-eslint/no-require-imports */
import healthcheck from '../data/healthcheck'

const { dbCheck, serviceCheckFactory } = healthcheck
const db = () =>
  dbCheck()
    .then(() => ({ name: 'db', status: 'ok', message: 'OK' }))
    .catch(err => ({ name: 'db', status: 'ERROR', message: err.message }))

const service = (name, url) => {
  const check = serviceCheckFactory(name, url)
  return () =>
    check()
      .then(result => ({ name, status: 'ok', message: result }))
      .catch(err => ({ name, status: 'ERROR', message: err }))
}

export default function healthcheckFactory(authUrl, prisonUrl, tokenVerificationUrl) {
  const checks = [
    db,
    service('auth', `${authUrl}/health/ping`),
    service('prison', `${prisonUrl}/health/ping`),
    service('tokenverification', `${tokenVerificationUrl}/health/ping`),
  ]

  return callback =>
    Promise.all(checks.map(fn => fn())).then(checkResults => {
      const allOk = checkResults.every(item => item.status === 'ok')
      const result = {
        healthy: allOk,
        checks: checkResults.reduce(gatherCheckInfo, {}),
      }
      callback(null, addAppInfo(result))
    })
}

function gatherCheckInfo(total, currentValue) {
  return { ...total, [currentValue.name]: currentValue.message }
}

function addAppInfo(result) {
  const buildInformation = getBuild()
  const buildInfo = {
    uptime: process.uptime(),
    build: buildInformation,
    version: buildInformation && buildInformation.buildNumber,
  }

  return { ...result, ...buildInfo }
}

function getBuild() {
  try {
    return require('../build-info.json')
  } catch (ex) {
    return null
  }
}
