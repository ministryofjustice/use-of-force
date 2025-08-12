/* eslint-disable no-await-in-loop */
import moment from 'moment'

import type LocationService from './locationService'
import AuthService from './authService'

export default class ReportEditService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(
    private readonly locationService: LocationService,
    private readonly authService: AuthService
  ) {}

  async constructChangesToView(username, reportSection, changes = []) {
    const questionSet = this.#getQuestionSet(reportSection)
    let response = []

    if (reportSection?.section === 'incidentDetails') {
      response = await this.#buildIncidentDetails(username, questionSet, changes)
    }

    return response
  }

  async persistChanges(data) {
    if (data.reportSection.section === 'incidentDetails') {
      // TODO
      // - update the current report
      // - create a new record in the report_edit table
    }
  }

  validateReasonForChangeInput(input) {
    if (!input.reason) {
      return [
        {
          href: '#reason',
          text: `Select the reason for changing ${input.reportSection.text}`,
        },
      ]
    }
    if (input.reason === 'anotherReasonForEdit' && !input.reasonText) {
      return [
        {
          href: '#reasonText',
          text: `Please specify the reason`,
        },
      ]
    }
    return []
  }

  private questionSets = {
    incidentDetails: {
      agencyId: { text: 'Prison', entity: 'prison' },
      incidentLocation: { text: 'Incident location', entity: 'internalLocation' },
      witnesses: { text: 'Witnesses to the incident', entity: 'person' },
      plannedUseOfForce: { text: 'Was use of force planned', entity: 'boolean' },
      authorisedBy: { text: 'Who authorised use of force', entity: 'person' },
      incidentDate: { text: 'Incident date', entity: 'date' },
    },
    // Add other section mappings here
  }

  async #buildIncidentDetails(username, questionSet, changes) {
    const result = []
    const keys = Object.keys(changes)

    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
      const question = questionSet[key]?.text
      const entity = questionSet[key]?.entity
      let isDate = false
      let isPrison = false
      let isInternalLocation = false

      if (entity === 'date') isDate = true
      if (entity === 'prison') isPrison = true
      if (entity === 'internalLocation') isInternalLocation = true

      const isString = (typeof changes[key].newValue || typeof changes[key].oldValue) === typeof ''

      if (isDate) {
        const oldValue = moment(changes[key].oldValue).format('DD/MM/YYYY HH:mm')
        const newValue = moment(changes[key].newValue).format('DD/MM/YYYY HH:mm')
        result.push({
          question,
          oldValue,
          newValue,
        })
      } else if (isPrison) {
        const oldValue = await this.#getPrison(username, changes[key].oldValue)
        const newValue = await this.#getPrison(username, changes[key].newValue)
        result.push({
          question,
          oldValue,
          newValue,
        })
      } else if (isInternalLocation) {
        const oldValue = await this.#getInternalLocation(username, changes[key].oldValue)
        const newValue = await this.#getInternalLocation(username, changes[key].newValue)
        result.push({
          question,
          oldValue,
          newValue,
        })
      } else if (isString) {
        result.push({
          question,
          oldValue: changes[key].oldValue,
          newValue: changes[key].newValue,
        })
      } else {
        result.push({
          question,
          oldValue: this.#getArrayContentsAsString(changes[key].oldValue),
          newValue: this.#getArrayContentsAsString(changes[key].newValue),
        })
      }
    }
    return result
  }

  #getQuestionSet(reportSection) {
    return this.questionSets[reportSection?.section] || {}
  }

  #getArrayContentsAsString(content: { name: string }[]): string {
    return content.map(c => c.name).join(', ')
  }

  async #getPrison(username, agencyId: string): Promise<string> {
    const token = await this.authService.getSystemClientToken(username)
    const prison = await this.locationService.getPrisonById(token, agencyId)
    return prison.description
  }

  async #getInternalLocation(username, uuid: string) {
    const token = await this.authService.getSystemClientToken(username)
    const location = await this.locationService.getLocation(token, uuid)
    return location
  }
}
