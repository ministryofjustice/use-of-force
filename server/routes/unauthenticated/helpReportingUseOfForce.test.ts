import request from 'supertest'
import { appWithAllRoutes } from '../__test/appSetup'
import config from '../../config'

describe('GET Help reporting a use of force incident', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET Help reporting a use of force incident', () => {
    test("should render the 'Help reporting a use of force incident' page", () => {
      return request(appWithAllRoutes(undefined, undefined, false))
        .get(`/get-help`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.status).toBe(200)
          expect(res.text).toContain('Help reporting a use of force incident')
        })
    })

    test('should display the telephone numbers', () => {
      return request(appWithAllRoutes(undefined, undefined, true))
        .get(`/get-help`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.status).toBe(200)
          expect(res.text).toContain(config.supportTelephone)
          expect(res.text).toContain(config.supportExtension)
        })
    })
  })
})
