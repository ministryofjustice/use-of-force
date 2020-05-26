import { Prison } from '../types/uof'

import logger = require('../../log.js')

export default function createLocationService(elite2ClientBuilder, incidentClient) {
  const getPrisons = async (token: string): Promise<Prison[]> => {
    const elite2Client = elite2ClientBuilder(token)
    const prisons = await elite2Client.getPrisons()
    logger.info('Retrieving all agencies from elite2')
    return prisons.sort((a, b) => a.description.localeCompare(b.description, 'en', { ignorePunctuation: true }))
  }

  const getPrisonById = async (token: string, prisonId: string): Promise<Prison> => {
    const elite2Client = elite2ClientBuilder(token)
    logger.info('Retrieving single prison from elite2')
    return elite2Client.getPrisonById(prisonId)
  }

  const updateAgencyId = async (agencyId, username, bookingId) => {
    logger.info('updating agencyId')
    await incidentClient.updateAgencyId(agencyId, username, bookingId)
  }

  return {
    getPrisons,
    getPrisonById,
    updateAgencyId,
  }
}
