/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import moment from 'moment'
import type LocationService from './locationService'
import AuthService from './authService'

export default class EditIncidentDetailsService {
  constructor(
    private readonly locationService: LocationService,
    private readonly authService: AuthService
  ) {}

  async buildIncidentDetails(username, questionSet, changes) {
    const result = []

    for (const key of Object.keys(changes)) {
      const { oldValue, newValue } = changes[key]
      const question = questionSet[key]

      let resolvedOldValue: string
      let resolvedNewValue

      switch (key) {
        case 'incidentDate':
          resolvedOldValue = moment(oldValue).format('DD/MM/YYYY HH:mm')
          resolvedNewValue = moment(newValue).format('DD/MM/YYYY HH:mm')
          break

        case 'agencyId':
          resolvedOldValue = await this.#getAgency(username, oldValue)
          resolvedNewValue = await this.#getAgency(username, newValue)
          break

        case 'incidentLocation':
          resolvedOldValue = await this.#getIncidentLocation(username, oldValue)
          resolvedNewValue = await this.#getIncidentLocation(username, newValue)
          break

        case 'witnesses':
          resolvedOldValue = oldValue ? oldValue.map(c => c.name).join(', ') : undefined
          resolvedNewValue = newValue ? newValue.map(c => c.name).join(', ') : undefined
          break

        default:
          resolvedOldValue = oldValue
          resolvedNewValue = newValue
      }

      result.push({ question, oldValue: resolvedOldValue, newValue: resolvedNewValue })
    }

    return result
  }

  async #getAgency(username: string, agencyId: string): Promise<string> {
    const token = await this.authService.getSystemClientToken(username)
    const prison = await this.locationService.getPrisonById(token, agencyId)
    return prison.description
  }

  async #getIncidentLocation(username: string, uuid: string) {
    const token = await this.authService.getSystemClientToken(username)
    const location = await this.locationService.getLocation(token, uuid)
    return location
  }
}
