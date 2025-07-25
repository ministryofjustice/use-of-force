import getIncidentDate from './getIncidentDate'

describe('getIncidentDate', () => {
  it('it should convert Date string to object form', () => {
    const savedValue = new Date('July 17, 2025 15:24:00')
    const userProvidedValue = null

    expect(getIncidentDate(savedValue, userProvidedValue)).toEqual({
      date: '17/07/2025',
      hour: '15',
      minute: '24',
    })
  })

  it('it should convert nested object to correct form', () => {
    const savedValue = null
    const userProvidedValue = {
      date: '08/07/25',
      time: {
        hour: '15',
        minute: '00',
      },
      value: null,
    }
    expect(getIncidentDate(savedValue, userProvidedValue)).toEqual({
      date: '08/07/25',
      hour: '15',
      minute: '00',
    })
  })

  it('it should return null', () => {
    const savedValue = null
    const userProvidedValue = null
    expect(getIncidentDate(savedValue, userProvidedValue)).toEqual(null)
  })
})
