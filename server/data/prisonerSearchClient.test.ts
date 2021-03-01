import nock from 'nock'
import restClientBuilder from '.'
import config from '../config'
import PrisonerSearchClient from './prisonerSearchClient'

describe('prisonSearchClientBuilder', () => {
  let fakePrisonerSearchApi
  let client: PrisonerSearchClient

  const token = 'token-1'

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearch.url)
    client = restClientBuilder('prisonerSearch', config.apis.prisonerSearch, PrisonerSearchClient)(token)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('search', () => {
    it('should return data from api', async () => {
      const results = []
      fakePrisonerSearchApi
        .post(
          `/prisoner-search/match`,
          '{"prisonerIdentifier":"AAA123AB","firstName":"Bob","lastName":"Smith","prisonId":"MDI","includeAliases":false}'
        )
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.search({
        prisonNumber: 'AAA123AB',
        firstName: 'Bob',
        lastName: 'Smith',
        agencyId: 'MDI',
      })
      expect(output).toEqual(results)
    })
  })
})
