const logger = require('../../log.js')
const { StatementStatus } = require('../config/types')
const statementConfig = require('../config/statement')
const { validate } = require('../utils/fieldValidation')

module.exports = function createStatementService({ statementsClient }) {
  const getStatements = async (userId, status) => {
    const data = await statementsClient.getStatements(userId, status)
    return data.rows
  }

  const getStatementForUser = async (userId, reportId, status) => {
    const statement = await statementsClient.getStatementForUser(userId, reportId, status)
    if (!statement) {
      throw new Error(`Report: '${reportId}' does not exist`)
    }
    const additionalComments = await statementsClient.getAdditionalComments(statement.id)
    return { additionalComments, ...statement }
  }

  const validateSavedStatement = async (username, reportId) => {
    const statement = await getStatementForUser(username, reportId, StatementStatus.PENDING)
    const errors = statementConfig.validate ? validate(statementConfig.fields, statement, true) : []
    return errors
  }

  const save = (userId, reportId, statement) => {
    logger.info(`Saving statement for user: ${userId} and report: ${reportId}`)
    return statementsClient.saveStatement(userId, reportId, statement)
  }

  const submitStatement = (userId, reportId) => {
    logger.info(`Submitting statement for user: ${userId} and report: ${reportId}`)
    return statementsClient.submitStatement(userId, reportId)
  }

  const saveAdditionalComment = (statementId, additionalComment) => {
    logger.info(`Saving additional comment for statement with id: ${statementId}`)
    return statementsClient.saveAdditionalComment(statementId, additionalComment)
  }

  return {
    getStatementForUser,
    getStatements,
    save,
    submitStatement,
    validateSavedStatement,
    saveAdditionalComment,
  }
}
