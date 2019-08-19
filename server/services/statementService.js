const logger = require('../../log.js')
const { StatementStatus } = require('../config/types')
const statementConfig = require('../config/statement')
const { validate } = require('../utils/fieldValidation')

module.exports = function createIncidentService({ incidentClient }) {
  const getStatementsForUser = async (userId, status) => {
    const data = await incidentClient.getStatementsForUser(userId, status)
    return data.rows
  }

  const getStatement = async (userId, incidentId, status) => {
    const statement = await incidentClient.getStatement(userId, incidentId, status)
    if (!statement) {
      throw new Error(`Incident: '${incidentId}' does not exist`)
    }
    return statement
  }

  const validateSavedStatement = async (username, incidentId) => {
    const statement = await getStatement(username, incidentId, StatementStatus.PENDING)
    const errors = statementConfig.validate ? validate(statementConfig.fields, statement, true) : []
    return errors
  }

  const saveStatement = (userId, incidentId, statement) => {
    logger.info(`Saving statement for user: ${userId} and incident: ${incidentId}`)
    return incidentClient.saveStatement(userId, incidentId, statement)
  }

  const submitStatement = (userId, incidentId) => {
    logger.info(`Submitting statement for user: ${userId} and incident: ${incidentId}`)
    return incidentClient.submitStatement(userId, incidentId)
  }

  return {
    getStatement,
    getStatementsForUser,
    saveStatement,
    submitStatement,
    validateSavedStatement,
  }
}
