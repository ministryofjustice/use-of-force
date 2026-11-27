import nock from 'nock'
import config from '../config'
import PrisonerSearchClient from './prisonerSearchClient'

describe('prisonSearchClientBuilder', () => {
  let fakePrisonerSearchApi
  let client: PrisonerSearchClient

  const token = 'token-1'

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearch.url)
    client = new PrisonerSearchClient()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPrisonerNames', () => {
    it('asks for only the name fields', async () => {
      const results = [{ prisonerNumber: 'A1234AA', firstName: 'SAM', lastName: 'SMITH' }]
      fakePrisonerSearchApi
        .post('/prisoner-search/prisoner-numbers', { prisonerNumbers: ['A1234AA'] })
        .query({ responseFields: 'prisonerNumber,firstName,lastName' })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getPrisonerNames(['A1234AA'], token)

      expect(output).toEqual(results)
    })
  })

  describe('search', () => {
    it('returns data from the api', async () => {
      const results = []
      fakePrisonerSearchApi
        .post(
          `/prisoner-search/match`,
          '{"prisonerIdentifier":"AAA123AB","firstName":"Bob","lastName":"Smith","prisonId":"MDI","includeAliases":false}',
        )
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.search(
        {
          prisonNumber: 'AAA123AB',
          firstName: 'Bob',
          lastName: 'Smith',
          agencyId: 'MDI',
        },
        token,
      )
      expect(output).toEqual(results)
    })
  })
})
