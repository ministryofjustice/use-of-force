import request from 'supertest'
import { appWithAllRoutes } from './appSetup'

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  test('should render content with stack in dev mode', () => {
    return request(appWithAllRoutes(undefined, undefined, false))
      .get(`/report/-19/does-not-exist`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.status).toBe(404)
        expect(res.text).toContain('Error: Not found')
        expect(res.text).not.toContain('Something went wrong. The error has been logged. Please try again')
      })
  })

  test('should render content without stack in production mode', () => {
    return request(appWithAllRoutes(undefined, undefined, true))
      .get(`/report/-19/does-not-exist`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.status).toBe(404)
        expect(res.text).not.toContain('Error: Not found')
        expect(res.text).toContain('Something went wrong. The error has been logged. Please try again')
      })
  })
})
