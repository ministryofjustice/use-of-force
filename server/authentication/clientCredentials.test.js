const { generate } = require('./clientCredentials')

describe('generate', () => {
  it('Token can be generated', () => {
    expect(generate('bob', 'password1')).toBe('Basic Ym9iOnBhc3N3b3JkMQ==')
  })
  it('Token can be generated with special characters', () => {
    const value = generate('bob', "p@'s&sw/o$+ rd1")

    const decoded = Buffer.from(value.substring(6), 'base64').toString('utf-8')

    expect(decoded).toBe("bob:p@'s&sw/o$+ rd1")
  })
})
