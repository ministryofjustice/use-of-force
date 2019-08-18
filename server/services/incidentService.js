const logger = require('../../log.js')
const { isNilOrEmpty } = require('../utils/utils')

module.exports = function createIncidentService({ incidentClient, elite2ClientBuilder }) {
  function getCurrentDraftIncident(userId, bookingId) {
    return incidentClient.getCurrentDraftIncident(userId, bookingId)
  }

  async function submitForm(userId, bookingId) {
    const form = await getCurrentDraftIncident(userId, bookingId)
    if (form.id) {
      logger.info(`Submitting form for user: ${userId} and booking: ${bookingId}`)
      await incidentClient.submit(userId, bookingId)
      return form.id
    }
    return false
  }

  async function update({ currentUser, formId, bookingId, formObject, incidentDate, involvedStaff }) {
    const incidentId = await updateIncident({
      currentUser,
      formId,
      bookingId,
      formObject,
      incidentDate,
    })
    if (involvedStaff) {
      await updateInvolvedStaff({ incidentId, involvedStaff })
    }
  }

  async function updateIncident({ currentUser, formId, bookingId, formObject, incidentDate }) {
    const { username: userId, token, displayName: reporterName } = currentUser
    if (formId) {
      if (!isNilOrEmpty(formObject)) {
        logger.info(`Updated incident with id: ${formId} for user: ${userId} on booking: ${bookingId}`)
        await incidentClient.updateDraftIncident(formId, incidentDate, formObject)
      }
      return formId
    }
    const elite2Client = elite2ClientBuilder(token)
    const { offenderNo } = await elite2Client.getOffenderDetails(bookingId)
    const id = await incidentClient.createDraftIncident({
      userId,
      reporterName,
      bookingId,
      offenderNo,
      incidentDate,
      formResponse: formObject,
    })
    logger.info(`Created new incident with id: ${id} for user: ${userId} on booking: ${bookingId}`)
    return id
  }

  async function updateInvolvedStaff({ incidentId, involvedStaff = [] }) {
    await incidentClient.deleteInvolvedStaff(incidentId)
    if (involvedStaff.length) {
      // TODO The reporting staff may need to be added to the list
      const staff = involvedStaff.map(user => ({
        userId: user.username,
        name: user.name,
        email: user.email,
      }))
      await incidentClient.insertInvolvedStaff(incidentId, staff)
    }
  }

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

  const getInvolvedStaff = incidentId => {
    return incidentClient.getInvolvedStaff(incidentId)
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
    getCurrentDraftIncident,
    update,
    submitForm,
    getStatement,
    getStatementsForUser,
    getInvolvedStaff,
    saveStatement,
    submitStatement,
  }
}
