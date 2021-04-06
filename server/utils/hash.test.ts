import { stringToHash, isHashOfString } from './hash'

describe('hash', () => {
  it('should return hash', () => {
    const inputString = 'abc'
    const salt = 'ABC'
    const result = stringToHash(inputString, salt)
    expect(result).toEqual('lZ//2h1Ga9PBB4BodbZfS6xevugjdDBlDgh3emZl1D4=')
  })

  it('should verify hash matches input string', () => {
    const originalString = 'abc'
    const salt = 'ABC'
    const result = isHashOfString('lZ//2h1Ga9PBB4BodbZfS6xevugjdDBlDgh3emZl1D4=', originalString, salt)
    expect(result).toBe(true)
  })

  it('should verify hash does not match input string', () => {
    const originalString = 'abc'
    const salt = 'ABD'
    const result = isHashOfString('lZ//2h1Ga9PBB4BodbZfS6xevugjdDBlDgh3emZl1D4=', originalString, salt)
    expect(result).toBe(false)
  })
})
