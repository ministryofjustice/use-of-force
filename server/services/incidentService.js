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

  async function update({ token, userId, reporterName, formId, bookingId, formObject, incidentDate, involved }) {
    const incidentId = await updateIncident({
      token,
      userId,
      reporterName,
      formId,
      bookingId,
      formObject,
      incidentDate,
    })
    if (involved) {
      await updateInvolvedStaff({ incidentId, userId, reporterName, involvedStaff: involved })
    }
  }

  async function updateIncident({ token, userId, reporterName, formId, bookingId, formObject, incidentDate }) {
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
      bookingId,
      reporterName,
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
      // TODO: Currently have no way of retrieving user_id from a name - so currently coding both to same value
      const staff = involvedStaff.map(user => ({
        userId: user.name,
        ...user,
      }))
      await incidentClient.insertInvolvedStaff(incidentId, staff)
    }
  }

  const getIncidentsForUser = async (userId, status) => {
    const data = await incidentClient.getIncidentsForUser(userId, status)
    return data.rows
  }

  const getStatement = async (userId, incidentId) => {
    const statement = await incidentClient.getStatement(userId, incidentId)
    if (!statement) {
      throw new Error(`Incident: '${incidentId}' does not exist`)
    }
    return statement
  }

  const getInvolvedStaff = incidentId => {
    return incidentClient.getInvolvedStaff(incidentId)
  }

  const submitStatement = (userId, incidentId, statement) => {
    logger.info(`Submitting statement for user: ${userId} and incident: ${incidentId}`)
    incidentClient.submitStatement(userId, incidentId, statement)
  }

  return {
    getCurrentDraftIncident,
    update,
    submitForm,
    getStatement,
    getIncidentsForUser,
    getInvolvedStaff,
    submitStatement,
  }
}
