const request = require('supertest')
const { user, appWithAllRoutes } = require('./__test/appSetup')

const userSupplier = jest.fn()

/** @type {any} */
const offenderService = {
  getOffenderImage: jest.fn(),
}

describe('api', () => {
  let app

  beforeEach(() => {
    offenderService.getOffenderImage.mockResolvedValue('')
    app = appWithAllRoutes({ offenderService }, userSupplier)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET /api/offender/:bookingId/image', () => {
    beforeEach(() => {
      userSupplier.mockReturnValue(user)
    })
    it('should render using system creds for retrieving image', async () => {
      await request(app)
        .get('/api/offender/1234/image')
        .expect('Content-Type', 'image/jpeg')
        .expect(() => {
          expect(offenderService.getOffenderImage).toHaveBeenCalledWith('user1-system-token', '1234')
        })
    })
  })
})
