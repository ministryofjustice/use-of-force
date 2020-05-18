import validateForm from './searchForPrisonerValidation'

describe('validateForm', () => {
  describe('prisonNumber', () => {
    it('valid', () => {
      expect(validateForm({ prisonNumber: 'A1234AA', firstName: null, lastName: null, agencyId: null })).toBeNull()
    })
    it('tooShort', () => {
      expect(validateForm({ prisonNumber: 'A1234A', firstName: null, lastName: null, agencyId: null })).toStrictEqual({
        href: '#prisonNumber',
        text: 'Enter a prison number using 7 characters in the format A1234AA',
      })
    })
    it('invalid Pattern', () => {
      expect(validateForm({ prisonNumber: '01234AA', firstName: null, lastName: null, agencyId: null })).toStrictEqual({
        href: '#prisonNumber',
        text: 'Enter a prison number starting with a letter in the format A1234AA',
      })
    })
  })
  describe('nameAndPrisonSearch', () => {
    it('last name and prison', () => {
      expect(validateForm({ prisonNumber: null, firstName: null, lastName: 'SMITH', agencyId: 'MDI' })).toBeNull()
    })

    it('first, last name and prison', () => {
      expect(validateForm({ prisonNumber: null, firstName: 'Bob', lastName: 'SMITH', agencyId: 'MDI' })).toBeNull()
    })

    it('all Details', () => {
      expect(validateForm({ prisonNumber: 'A1234AA', firstName: 'Bob', lastName: 'SMITH', agencyId: 'MDI' })).toBeNull()
    })

    it('last name but no prison', () => {
      expect(
        validateForm({ prisonNumber: 'A1234AA', firstName: null, lastName: 'SMITH', agencyId: null })
      ).toStrictEqual({
        href: '#prisonNumber',
        text: 'You must search using either the prison number or the prisoner’s last name and prison',
      })
    })

    it('last prison but no last name', () => {
      expect(validateForm({ prisonNumber: 'A1234AA', firstName: null, lastName: null, agencyId: 'MDI' })).toStrictEqual(
        {
          href: '#prisonNumber',
          text: 'You must search using either the prison number or the prisoner’s last name and prison',
        }
      )
    })

    it('prison and first name but no last name', () => {
      expect(
        validateForm({ prisonNumber: 'A1234AA', firstName: 'BOB', lastName: null, agencyId: 'MDI' })
      ).toStrictEqual({
        href: '#prisonNumber',
        text: 'You must search using either the prison number or the prisoner’s last name and prison',
      })
    })

    it('no details', () => {
      expect(validateForm({ prisonNumber: null, firstName: null, lastName: null, agencyId: null })).toStrictEqual({
        href: '#prisonNumber',
        text: 'You must search using either the prison number or the prisoner’s last name and prison',
      })
    })
  })
})
