import { SearchForm } from '../../data/prisonerSearchClient'

const prisonNumberPatttern = /^[A-Z][0-9]{4}[A-Z]{2}$/i

type Error = {
  href: string
  text: string
}

const asString = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
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
  const prisonNumberExtracted = asString(prisonNumber)
  const lastNameExtracted = asString(lastName)
  const firstNameExtracted = asString(firstName)
  const agencyIdExtracted = asString(agencyId)

  if (prisonNumberExtracted && prisonNumberExtracted.length < 7) {
    return errors.PRISON_NUMBER_TOO_SMALL
  }

  if (prisonNumberExtracted && !prisonNumberExtracted.match(prisonNumberPatttern)) {
    return errors.PRISON_NUMBER_WRONG_FORMAT
  }

  const prisonWithoutName = agencyIdExtracted && !lastNameExtracted
  const nameWithoutPrison = !agencyIdExtracted && (lastNameExtracted || firstNameExtracted)
  const prisonNumberNorPrison = !prisonNumberExtracted && !agencyIdExtracted
  if (prisonNumberNorPrison || prisonWithoutName || nameWithoutPrison) {
    return errors.INVALID_QUERY
  }

  return null
}
