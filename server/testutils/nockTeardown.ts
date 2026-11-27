import nock from 'nock'

// nock patches node's http module on import; jest re-imports nock for every test file in a worker, so remove its
// interceptor after each file to stop them piling up on the shared http module
afterAll(() => {
  nock.cleanAll()
  nock.restore()
})
