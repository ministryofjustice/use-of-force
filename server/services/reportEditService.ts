import moment from 'moment'
import sequence from '../config/edit/questionSequence'
import questionSets from '../config/edit/questionSets'
import incidentDetailsConfig, { QUESTION_ID, REASON } from '../config/edit/incidentDetailsConfig'
import { excludeEmptyValuesThenTrim } from '../utils/utils'
import { LoggedInUser } from '../types/uof'
import { PersistData } from './editReports/types/reportEditServiceTypes'
import compareIncidentDetailsEditWithReport from './editReports/incidentDetails'
import ReportService from './reportService'
import logger from '../../log'
import EditIncidentDetailsService from './editIncidentDetailsService'
import AuthService from './authService'
import LocationService from './locationService'

export default class ReportEditService {
  constructor(
    private readonly reportService: ReportService,
    private readonly editIncidentDetailsService: EditIncidentDetailsService,
    private readonly locationService: LocationService,
    private readonly authService: AuthService
  ) {}

  async constructChangesToView(username: string, reportSection: { section: string }, changes = []) {
    let response = []

    if (reportSection?.section === incidentDetailsConfig.SECTION) {
      response = await this.editIncidentDetailsService.buildIncidentDetails(
        username,
        questionSets[reportSection.section],
        changes
      )
    }
    // add similar ifs for the other page

    return response
  }

  compareEditsWithReport({ report, valuesToCompareWithReport: valuesFromRequestBody, reportSection }) {
    switch (reportSection) {
      case incidentDetailsConfig.SECTION:
        return compareIncidentDetailsEditWithReport(report, valuesFromRequestBody)

      // add more sections as needed, eg:
      // case anotherSectionConfig.SECTION:
      //   return compareAnotherSectionEditWithReport(report, valuesFromRequestBody)

      default:
        return {}
    }
  }

  removeHasChangedKey(changes) {
    return Object.keys(changes).reduce((acc, key) => {
      const { hasChanged, ...rest } = changes[key] // remove hasChanged
      acc[key] = rest
      return acc
    }, {})
  }

  async persistChanges(user: LoggedInUser, data: PersistData): Promise<void> {
    const pageInput = data.pageInput[0]
    let updatedSection = {} // for updating the original report

    // for incidentDetails
    if (data.reportSection.section === incidentDetailsConfig.SECTION) {
      updatedSection = {
        witnesses: excludeEmptyValuesThenTrim(pageInput.witnesses),
        plannedUseOfForce: JSON.parse(pageInput.plannedUseOfForce),
        authorisedBy: JSON.parse(pageInput.plannedUseOfForce) ? pageInput.authorisedBy : undefined,
        incidentLocationId: pageInput.incidentLocationId,
      }
      // do new if blocks for the other sections of the report here
    }

    try {
      await this.reportService.updateWithEdits(
        user,
        parseInt(data.reportId, 10),
        data.reportSection.section,
        updatedSection,
        data.changes,
        data.reason,
        data.reasonText,
        data.reasonAdditionalInfo,
        data.reportOwnerChanged,
        pageInput.incidentDate
      )
    } catch (e) {
      logger.error(`Could not persist changes to report ${parseInt(data.reportId, 10)}. ${e}`)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateReasonForChangeInput(input: { reason: string; reasonText: string; reportSection: any }) {
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

  async mapEditDataToViewOutput(edits, user) {
    const changeObjsWrappedInArray = edits.map(edit => ({ ...edit, changes: [edit.changes] }))
    const orderedEdits = this.reorderKeysInChangesArrayWithinEditsToSpecificSequence(changeObjsWrappedInArray)
    return Promise.all(
      orderedEdits.map(async edit => ({
        editDate: edit.editDate,
        editorName: edit.editorName,
        whatChanged: this.getWhatChanged(edit.changes),
        changedFrom: await this.getChangedFrom(edit.changes, user),
        changedTo: await this.getChangedTo(edit.changes, user),
        reason: this.mapReasonToTitleAndText(edit),
        additionalComments: edit.additionalComments,
      }))
    )
  }

  reorderKeysInChangesArrayWithinEditsToSpecificSequence(edits) {
    return edits.map(edit => {
      const original = edit.changes[0] || {}

      const ordered = sequence.reduce((acc, key) => {
        if (original[key] !== undefined) {
          acc[key] = original[key]
        }
        return acc
      }, {})

      return {
        ...edit,
        changes: [ordered],
      }
    })
  }

  getWhatChanged(changes) {
    const changeObject = changes[0]
    const keys = Object.keys(changeObject)
    return keys.map(k => changeObject[k].question)
  }

  async getChangedFrom(changes, user) {
    const changeObject = changes[0]
    const keys = Object.keys(changeObject)

    return Promise.all(keys.map(k => this.applyCorrectFormat(k, changeObject[k].oldValue, user)))
  }

  async getChangedTo(changes, user) {
    const changeObject = changes[0]
    const keys = Object.keys(changeObject)

    return Promise.all(keys.map(k => this.applyCorrectFormat(k, changeObject[k].newValue, user)))
  }

  // this is converting, dates, locationIds, prisonIds etc to the values to be displayed in edit history page
  async applyCorrectFormat(k, v, user) {
    const handlers = {
      [QUESTION_ID.INCIDENT_DATE]: () => moment(v).format('DD/MM/YYYY HH:mm'),

      [QUESTION_ID.AGENCY_ID]: async () => {
        const token = await this.authService.getSystemClientToken(user.username)
        const result = await this.locationService.getPrisonById(token, v)
        return result.description
      },

      [QUESTION_ID.INCIDENT_LOCATION]: async () => {
        const token = await this.authService.getSystemClientToken(user.username)
        const result = await this.locationService.getLocation(token, v)
        return result
      },

      [QUESTION_ID.PLANNED_UOF]: () => (v === true ? 'Yes' : 'No'),

      [QUESTION_ID.AUTHORISED_BY]: () => v,

      [QUESTION_ID.WITNESSES]: () => (Array.isArray(v) && v.length > 0 ? v.map(obj => obj.name).join(', ') : ''),

      // add more handlers here for all the other pages
    }

    const handler = handlers[k]
    return handler ? handler() : v
  }

  mapReasonToTitleAndText(data) {
    switch (data.reason) {
      case REASON.ERROR_IN_REPORT:
        return REASON.ERROR_IN_REPORT_DESCRIPTION

      case REASON.SOMETHING_MISSING:
        return REASON.SOMETHING_MISSING_DESCRIPTION

      case REASON.NEW_EVIDENCE:
        return REASON.NEW_EVIDENCE_DESCRIPTION

      default:
        return `${REASON.ANOTHER_REASON_DESCRIPTION}: ${data.reasonText}`
    }
  }
}
