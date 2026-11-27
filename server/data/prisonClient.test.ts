import nock from 'nock'
import PrisonClient from './prisonClient'
import config from '../config'

describe('prisonClient', () => {
  let fakePrisonApi
  let prisonClient: PrisonClient

  const token = 'token-1'

  beforeEach(() => {
    fakePrisonApi = nock(config.apis.prison.url)
    prisonClient = new PrisonClient()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getOffenderDetails', () => {
    it('should return data from api', async () => {
      const offenderResponse = {}
      fakePrisonApi
        .get(`/api/bookings/12345?basicInfo=false`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, offenderResponse)

      const output = await prisonClient.getOffenderDetails(12345, token)
      expect(output).toEqual(offenderResponse)
    })
  })
})
