import express from 'express'
import nunjucksSetup from './nunjucksSetup'

describe('nunjucksSetup', () => {
  const app = express()
  const njk = nunjucksSetup(app)

  it('toChecked', () => {
    const model = [
      { desc: 'car', code: 'CAR' },
      { desc: 'bus', code: 'BUS' },
      { desc: 'boat', code: 'BOAT' },
    ]

    const result = njk.getFilter('toChecked')(model, 'code', 'desc', ['CAR', 'BOAT'])

    expect(result).toEqual([
      {
        checked: true,
        text: 'car',
        value: 'CAR',
      },
      {
        checked: false,
        text: 'bus',
        value: 'BUS',
      },
      {
        checked: true,
        text: 'boat',
        value: 'BOAT',
      },
    ])
  })
})
