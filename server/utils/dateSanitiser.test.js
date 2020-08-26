const moment = require('moment')
const sanitiser = require('./dateSanitiser')

describe('sanitiser', () => {
  const check = date => expect(sanitiser(date))
  const toDate = val => moment(val).toDate()

  describe('no data received', () => {
    test('date, time and hours all undefined', () =>
      check({ date: undefined, time: { hour: undefined, minute: undefined } }).toEqual({
        date: '',
        time: { hour: '', minute: '' },
        value: null,
      }))

    test('date, time and hours all empty', () =>
      check({ date: '', time: { hour: '', minute: '' } }).toEqual({
        date: '',
        time: { hour: '', minute: '' },
        value: null,
      }))
  })

  describe('incomplete data set', () => {
    test('empty time object', () =>
      check({ date: '01/01/2019', time: {} }).toEqual({
        date: '01/01/2019',
        time: { hour: '', minute: '' },
        value: null,
      }))

    test('missing hour and min values', () =>
      check({ date: '01/01/2019', time: { hour: undefined, minute: undefined } }).toEqual({
        date: '01/01/2019',
        time: { hour: '', minute: '' },
        value: null,
      }))

    test('missing date', () =>
      check({ date: undefined, time: { hour: '01', minute: '02' } }).toEqual({
        date: '',
        time: { hour: '01', minute: '02' },
        value: null,
      }))
  })

  describe('complete data set', () => {
    test('valid date time provided - AM', () =>
      check({ date: '21/01/2019', time: { hour: '09', minute: '45' } }).toEqual({
        date: '21/01/2019',
        time: { hour: '09', minute: '45' },
        value: toDate('2019-01-21T09:45:00.000Z'),
      }))

    test('valid date time provided - PM', () =>
      check({ date: '21/01/2019', time: { hour: '17', minute: '45' } }).toEqual({
        date: '21/01/2019',
        time: { hour: '17', minute: '45' },
        value: toDate('2019-01-21T17:45:00.000Z'),
      }))

    test('hour and minutes too long', () =>
      check({ date: '01/01/2019', time: { hour: '1234', minute: '5678' } }).toEqual({
        date: '01/01/2019',
        time: { hour: '1234', minute: '5678' },
        value: null,
      }))

    test('hour and minutes too short', () =>
      check({ date: '01/01/2019', time: { hour: '9', minute: '6' } }).toEqual({
        date: '01/01/2019',
        time: { hour: '9', minute: '6' },
        value: toDate('2019-01-01T09:06:00.000Z'),
      }))

    test('hour is with text', () =>
      check({ date: '21/01/2019', time: { hour: 'aa', minute: '12' } }).toEqual({
        date: '21/01/2019',
        time: { hour: 'aa', minute: '12' },
        value: null,
      }))

    test('minute is with text', () =>
      check({ date: '21/01/2019', time: { hour: '09', minute: 'aa' } }).toEqual({
        date: '21/01/2019',
        time: { hour: '09', minute: 'aa' },
        value: null,
      }))

    test('Date format - surrounding white spaces', () =>
      check({ date: '   21/01/2019    ', time: { hour: '17', minute: '45' } }).toEqual({
        date: '   21/01/2019    ',
        time: { hour: '17', minute: '45' },
        value: toDate('2019-01-21T17:45:00.000Z'),
      }))

    test('time is zero', () =>
      check({ date: '21/01/2019', time: { hour: '0', minute: '0' } }).toEqual({
        date: '21/01/2019',
        time: { hour: '0', minute: '0' },
        value: toDate('2019-01-21T00:00:00.000Z'),
      }))
  })
  test('date is zero', () =>
    check({ date: '00/01/2019', time: { hour: '01', minute: '02' } }).toEqual({
      date: '00/01/2019',
      time: { hour: '01', minute: '02' },
      value: null,
    }))
})
