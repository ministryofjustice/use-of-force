const logger = require('../../log.js')
const { StatementStatus } = require('../config/types')
const statementConfig = require('../config/statement')
const { validate } = require('../utils/fieldValidation')

module.exports = function createIncidentService({ incidentClient }) {
  const getStatementsForUser = async (userId, status) => {
    const data = await incidentClient.getStatementsForUser(userId, status)
    return data.rows
  }

  const getStatement = async (userId, reportId, status) => {
    const statement = await incidentClient.getStatement(userId, reportId, status)
    if (!statement) {
      throw new Error(`Report: '${reportId}' does not exist`)
    }
    return statement
  }

  const validateSavedStatement = async (username, reportId) => {
    const statement = await getStatement(username, reportId, StatementStatus.PENDING)
    const errors = statementConfig.validate ? validate(statementConfig.fields, statement, true) : []
    return errors
  }

  const saveStatement = (userId, reportId, statement) => {
    logger.info(`Saving statement for user: ${userId} and incident: ${reportId}`)
    return incidentClient.saveStatement(userId, reportId, statement)
  }

  const submitStatement = (userId, reportId) => {
    logger.info(`Submitting statement for user: ${userId} and incident: ${reportId}`)
    return incidentClient.submitStatement(userId, reportId)
  }

  return {
    getStatement,
    getStatementsForUser,
    saveStatement,
    submitStatement,
    validateSavedStatement,
  }
}
