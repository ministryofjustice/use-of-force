import signInService from './signInService'

describe('signInService', () => {
  let service
  let realDateNow

  beforeEach(() => {
    service = signInService()
    realDateNow = Date.now.bind(global.Date)
    const time = new Date('May 31, 2018 12:00:00')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.Date = jest.fn(() => time)
  })

  afterEach(() => {
    global.Date.now = realDateNow
  })

  describe('getUser', () => {
    test('should return user object if all apis succeed', () => {
      const expectedOutput = {
        token: 'type token',
        username: 'un',
      }

      return expect(service.getUser('type token', 'un')).toEqual(expectedOutput)
    })
  })
})
