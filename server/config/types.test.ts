import { BodyWornCameras, toLabel } from './types'

describe('toLabel', () => {
  test('Found', () => {
    return expect(toLabel(BodyWornCameras, 'NOT_KNOWN')).toEqual('Not Known')
  })
  test('Passed undefined', () => {
    return expect(toLabel(BodyWornCameras, undefined)).toEqual(undefined)
  })
})
