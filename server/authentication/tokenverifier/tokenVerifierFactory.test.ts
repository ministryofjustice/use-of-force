import nock from 'nock'
import tokenVerifierFactory from './tokenVerifierFactory'

describe('Token Verifier', () => {
  const TOKEN = 'token-1'

  const config = {
    url: 'http://localhost:8100',
    timeout: {
      response: 50,
      deadline: 100,
    },
    agent: {
      maxSockets: 2,
      maxFreeSockets: 1,
      freeSocketTimeout: 500,
    },
    enabled: true,
  }

  it('Should verify a token', async () => {
    const scope = nock(config.url, {
      reqheaders: {
        authorization: `Bearer ${TOKEN}`,
      },
    })
      .post('/token/verify', '')
      .reply(200, { active: true })

    const result = await tokenVerifierFactory(config).verify(TOKEN)
    expect(result).toEqual(true)
    expect(scope.isDone()).toEqual(true)
  })

  it('Should reject a token', async () => {
    const scope = nock(config.url, {
      reqheaders: {
        authorization: `Bearer ${TOKEN}`,
      },
    })
      .post('/token/verify', '')
      .reply(200, { active: false })

    const result = await tokenVerifierFactory(config).verify(TOKEN)
    expect(result).toEqual(false)
    expect(scope.isDone()).toEqual(true)
  })

  it('Should reject a token on third server error response', async () => {
    const scope = nock(config.url, {
      reqheaders: {
        authorization: `Bearer ${TOKEN}`,
      },
    })
      .post('/token/verify', '')
      .reply(500)
      .post('/token/verify', '')
      .reply(500)
      .post('/token/verify', '')
      .reply(500)

    const result = await tokenVerifierFactory(config).verify(TOKEN)
    expect(result).toEqual(false)
    expect(scope.isDone()).toEqual(true)
  })

  it('Should always accept a token when disabled', async () => {
    const result = await tokenVerifierFactory({ ...config, enabled: false }).verify(TOKEN)
    expect(result).toEqual(true)
  })
})
