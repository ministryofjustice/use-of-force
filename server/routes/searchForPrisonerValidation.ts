import { SearchForm } from '../data/prisonerSearchClient'

const prisonNumberPatttern = new RegExp(/^[A-Z][0-9]{4}[A-Z]{2}$/i)

type Error = {
  href: string
  text: string
}

const errors: { [key: string]: Error } = {
  INVALID_QUERY: {
    href: '#prisonNumber',
    text: 'You must search using either the prison number or the prisoner’s last name and prison',
  },
  PRISON_NUMBER_TOO_SMALL: {
    href: '#prisonNumber',
    text: 'Enter a prison number using 7 characters in the format A1234AA',
  },
  PRISON_NUMBER_WRONG_FORMAT: {
    href: '#prisonNumber',
    text: 'Enter a prison number starting with a letter in the format A1234AA',
  },
}

export default function validateForm({ prisonNumber, lastName, firstName, agencyId }: SearchForm): Error | null {
  if (prisonNumber && prisonNumber.length < 7) {
    return errors.PRISON_NUMBER_TOO_SMALL
  }

  if (prisonNumber && !prisonNumber.match(prisonNumberPatttern)) {
    return errors.PRISON_NUMBER_WRONG_FORMAT
  }

  const prisonWithoutName = agencyId && !lastName
  const nameWithoutPrison = !agencyId && (lastName || firstName)
  const prisonNumberNorPrison = !prisonNumber && !agencyId
  if (prisonNumberNorPrison || prisonWithoutName || nameWithoutPrison) {
    return errors.INVALID_QUERY
  }

  return null
}
