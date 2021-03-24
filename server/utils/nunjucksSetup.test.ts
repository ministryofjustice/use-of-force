import express from 'express'
import { SectionStatus } from '../services/drafts/reportStatusChecker'
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

  describe('composeStatus', () => {
    const composeStatus = njk.getGlobal('composeStatus')
    const check = (status1: SectionStatus, status2: SectionStatus) => expect(composeStatus(status1, status2))

    it('check composing', () => {
      check(SectionStatus.COMPLETE, SectionStatus.COMPLETE).toEqual(SectionStatus.COMPLETE)
      check(SectionStatus.NOT_STARTED, SectionStatus.NOT_STARTED).toEqual(SectionStatus.NOT_STARTED)
      check(SectionStatus.INCOMPLETE, SectionStatus.INCOMPLETE).toEqual(SectionStatus.INCOMPLETE)

      check(SectionStatus.NOT_STARTED, SectionStatus.INCOMPLETE).toEqual(SectionStatus.INCOMPLETE)
      check(SectionStatus.NOT_STARTED, SectionStatus.COMPLETE).toEqual(SectionStatus.INCOMPLETE)
      check(SectionStatus.COMPLETE, SectionStatus.INCOMPLETE).toEqual(SectionStatus.INCOMPLETE)
    })
  })
})
