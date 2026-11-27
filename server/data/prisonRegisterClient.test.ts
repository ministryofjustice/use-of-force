import nock from 'nock'
import PrisonRegisterClient from './prisonRegisterClient'
import config from '../config'

describe('prisonRegisterClient', () => {
  let fakePrisonRegister: nock.Scope
  let client: PrisonRegisterClient

  const token = 'token-1'

  beforeEach(() => {
    fakePrisonRegister = nock(config.apis.prisonRegister.url)
    client = new PrisonRegisterClient()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPrisons', () => {
    it('returns the active prisons', async () => {
      const prisons = [{ agencyId: 'MDI', description: 'Moorland (HMP & YOI)', agencyType: 'PRISON', active: true }]
      fakePrisonRegister
        .get('/api/agencies/type/PRISON?activeOnly=true')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, prisons)

      expect(await client.getPrisons(token)).toEqual(prisons)
    })
  })

  describe('getPrisonById', () => {
    it('returns the prison', async () => {
      const prison = { agencyId: 'MDI', description: 'Moorland (HMP & YOI)', agencyType: 'PRISON', active: true }
      fakePrisonRegister.get('/api/agencies/MDI').matchHeader('authorization', `Bearer ${token}`).reply(200, prison)

      expect(await client.getPrisonById('MDI', token)).toEqual(prison)
    })
  })
})
