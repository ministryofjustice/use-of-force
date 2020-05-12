import { Prison } from '../types/uof'

import logger = require('../../log.js')

import incidentClient = require('../data/incidentClient')

export default function createLocationService({ elite2ClientBuilder }) {
  const getActiveAgenciesByType = async (token: string, type: string): Promise<Prison[]> => {
    const elite2Client = elite2ClientBuilder(token)
    const prisons = await elite2Client.getActiveAgenciesByType(type)
    logger.info('Retrieving all agencies from elite2')
    return prisons.sort((a, b) => a.description.localeCompare(b.description, 'en', { ignorePunctuation: true }))
  }

  const getPrisonById = async (token: string, agencyId: string): Promise<Prison> => {
    const elite2Client = elite2ClientBuilder(token)
    logger.info('Retrieving single prison from elite2')
    return elite2Client.getPrisonById(agencyId)
  }

  const updateAgencyId = async (agencyId, username, bookingId) => {
    logger.info('updating agencyId')
    await incidentClient.updateAgencyId(agencyId, username, bookingId)
  }

  return {
    getActiveAgenciesByType,
    getPrisonById,
    updateAgencyId,
  }
}
