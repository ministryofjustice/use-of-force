/* eslint-disable no-await-in-loop */
import moment from 'moment'

import { excludeEmptyValuesThenTrim } from '../utils/utils'
import { LoggedInUser } from '../types/uof'
import { PersistData } from './editReports/types/reportEditServiceTypes'
import type LocationService from './locationService'
import AuthService from './authService'
import { compareIncidentDetailsEditWithReport } from './editReports/incidentDetails'
import incidentDetailsConfig from '../config/edit/incidentDetailsConfig'

import ReportService from './reportService'
import logger from '../../log'

export default class ReportEditService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(
    private readonly locationService: LocationService,
    private readonly authService: AuthService,
    private readonly reportService: ReportService
  ) {}

  async constructChangesToView(username, reportSection, changes = []) {
    const questionSet = this.#getQuestionSet(reportSection)
    let response = []

    if (reportSection?.section === incidentDetailsConfig.section) {
      response = await this.#buildIncidentDetails(username, questionSet, changes)
    }

    return response
  }

  compareEditsWithReport({ report, valuesToCompareWithReport: valuesFromRequestBody, reportSection }) {
    if (reportSection === incidentDetailsConfig.section) {
      return compareIncidentDetailsEditWithReport(report, valuesFromRequestBody)
    }
    // other report sections to be similarly compared here
    return {}
  }

  async persistChanges(user: LoggedInUser, data: PersistData): Promise<void> {
    const pageInput = data.pageInput[0]
    let updatedSection = {} // for updating the original report

    // for incidentDetails
    if (data.reportSection.section === incidentDetailsConfig.section) {
      updatedSection = {
        witnesses: excludeEmptyValuesThenTrim(pageInput.witnesses),
        plannedUseOfForce: JSON.parse(pageInput.plannedUseOfForce),
        authorisedBy: JSON.parse(pageInput.plannedUseOfForce) ? pageInput.authorisedBy : undefined,
        incidentLocationId: pageInput.incidentLocationId,
      }
    }

    try {
      await this.reportService.updateWithEdits(
        user,
        parseInt(data.reportId, 10),
        data.reportSection.section,
        updatedSection,
        data.changes,
        pageInput.incidentDate
      )
    } catch (e) {
      logger.error(`Could not persist changes to report ${parseInt(data.reportId, 10)}. ${e}`)
    }
  }

  validateReasonForChangeInput(input) {
    if (!input.reason) {
      return [
        {
          href: '#reason',
          text: `Provide a reason for changing ${input.reportSection.text}`,
        },
      ]
    }
    if (input.reason === 'anotherReasonForEdit' && !input.reasonText) {
      return [
        {
          href: '#reasonText',
          text: `Specify the reason for changing ${input.reportSection.text}`,
        },
      ]
    }
    return []
  }

  private questionSets = {
    incidentDetails: {
      agencyId: { text: 'Prison', entity: 'prison' },
      incidentLocation: { text: 'Incident location', entity: 'internalLocation' },
      witnesses: { text: 'Witnesses to the incident', entity: 'people' },
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
      let isBoolean = false
      let isPerson = false

      if (entity === 'date') isDate = true
      if (entity === 'prison') isPrison = true
      if (entity === 'internalLocation') isInternalLocation = true
      if (entity === 'boolean') isBoolean = true
      if (entity === 'person') isPerson = true

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
      } else if (isPerson || isBoolean) {
        result.push({
          question,
          oldValue: changes[key].oldValue,
          newValue: changes[key].newValue,
        })
      } else {
        result.push({
          question,
          oldValue: changes[key].oldValue ? this.#getArrayContentsAsString(changes[key].oldValue) : undefined,
          newValue: changes[key].newValue ? this.#getArrayContentsAsString(changes[key].newValue) : undefined,
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
