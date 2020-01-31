const moment = require('moment')
const sanitiser = require('./dateSanitiser')

describe('sanitiser', () => {
  const check = date => expect(sanitiser(date))
  const toDate = val => moment(val).toDate()

  describe('complete data', () => {
    test('standard time format', () =>
      check({ date: { day: '21', month: '01', year: '2019' }, time: '12:45' }).toEqual({
        raw: { day: '21', month: '01', year: '2019', time: '12:45' },
        date: {
          day: 21,
          month: 1,
          year: 2019,
        },
        time: '12:45',
        value: toDate('2019-01-21T12:45:00.000Z'),
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('alternative time format', () =>
      check({ date: { day: '21', month: '01', year: '2019' }, time: '12.45' }).toEqual({
        raw: { day: '21', month: '01', year: '2019', time: '12.45' },
        date: {
          day: 21,
          month: 1,
          year: 2019,
        },
        time: '12.45',
        value: toDate('2019-01-21T12:45:00.000Z'),
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('24 hour time - standard format', () =>
      check({ date: { day: '21', month: '01', year: '2019' }, time: '17.45' }).toEqual({
        raw: { day: '21', month: '01', year: '2019', time: '17.45' },
        date: { day: 21, month: 1, year: 2019 },
        time: '17.45',
        value: toDate('2019-01-21T17:45:00.000Z'),
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('24 hour time format - alternative format', () =>
      check({ date: { day: '21', month: '01', year: '2019' }, time: '17:45' }).toEqual({
        raw: { day: '21', month: '01', year: '2019', time: '17:45' },
        date: { day: 21, month: 1, year: 2019 },
        time: '17:45',
        value: toDate('2019-01-21T17:45:00.000Z'),
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('24 hour time format - surrounding white spaces', () =>
      check({ date: { day: '21', month: '01', year: '2019' }, time: '   17:45  ' }).toEqual({
        raw: { day: '21', month: '01', year: '2019', time: '17:45' },
        date: { day: 21, month: 1, year: 2019 },
        time: '17:45',
        value: toDate('2019-01-21T17:45:00.000Z'),
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('no trailing numbers on day or month', () =>
      check({ date: { day: '1', month: '1', year: '2019' }, time: '12.45' }).toEqual({
        raw: { day: '1', month: '1', year: '2019', time: '12.45' },
        date: { day: 1, month: 1, year: 2019 },
        time: '12.45',
        value: toDate('2019-01-01T12:45:00.000Z'),
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('double 00', () =>
      check({ date: { day: '1', month: '1', year: '2019' }, time: '00.00' }).toEqual({
        raw: { day: '1', month: '1', year: '2019', time: '00.00' },
        date: { day: 1, month: 1, year: 2019 },
        time: '00.00',
        value: toDate('2019-01-01T00:00:00.000Z'),
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))
  })

  describe('missing data', () => {
    test('no values', () =>
      check({}).toEqual({
        raw: { day: null, month: null, year: null, time: null },
        date: { day: null, month: null, year: null },
        time: null,
        value: null,
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('empty time', () =>
      check({ date: { day: '1', month: '1', year: '2019' }, time: '' }).toEqual({
        raw: { day: '1', month: '1', year: '2019', time: '' },
        date: { day: 1, month: 1, year: 2019 },
        time: '',
        value: null,
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('missing time', () =>
      check({ date: { day: '1', month: '1', year: '2019', time: null } }).toEqual({
        raw: { day: '1', month: '1', year: '2019', time: null },
        date: {
          day: 1,
          month: 1,
          year: 2019,
        },
        time: null,
        value: null,
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('invalid time - bad number', () =>
      check({ date: { day: '21', month: '01', year: '2019' }, time: '12345' }).toEqual({
        raw: { day: '21', month: '01', year: '2019', time: '12345' },
        date: { day: 21, month: 1, year: 2019 },
        time: '12345',
        value: null,
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('invalid time - with text', () =>
      check({ date: { day: '21', month: '01', year: '2019' }, time: 'ABCD' }).toEqual({
        raw: { day: '21', month: '01', year: '2019', time: 'ABCD' },
        date: { day: 21, month: 1, year: 2019 },
        time: 'ABCD',
        value: null,
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('missing day', () =>
      check({ date: { month: '01', year: '2019' }, time: '12.45' }).toEqual({
        raw: { day: null, month: '01', year: '2019', time: '12.45' },
        date: { day: null, month: 1, year: 2019 },
        time: '12.45',
        value: null,
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('missing month', () =>
      check({ date: { day: '21', year: '2019' }, time: '12.45' }).toEqual({
        raw: { day: '21', month: null, year: '2019', time: '12.45' },
        date: {
          day: 21,
          month: null,
          year: 2019,
        },
        time: '12.45',
        value: null,
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))

    test('missing year', () =>
      check({ date: { day: '21', month: '4' }, time: '12.45' }).toEqual({
        raw: { day: '21', month: '4', time: '12.45', year: null },
        date: { day: 21, month: 4, year: null },
        time: '12.45',
        value: null,
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      }))
  })

  describe('derived fields', () => {
    test('invalid date - none existent date', () =>
      check({ date: { day: '29', month: '2', year: '2019' }, time: '12:45' }).toEqual({
        raw: { day: '29', month: '2', year: '2019', time: '12:45' },
        date: {
          day: 29,
          month: 2,
          year: 2019,
        },
        time: '12:45',
        value: null,
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: true,
      }))
  })
})
