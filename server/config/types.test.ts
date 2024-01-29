import { BodyWornCameras, toLabel } from './types'

describe('toLabel', () => {
  test('Found', () => {
    return expect(toLabel(BodyWornCameras, 'YES')).toEqual('Yes')
  })
  test('Passed undefined', () => {
    return expect(toLabel(BodyWornCameras, undefined)).toEqual(undefined)
  })
})
