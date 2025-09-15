import moment from 'moment'
import reasonForChangeErrorMessageConfig from '../config/edit/reasonForChangeErrorMessageConfig'
import sequence from '../config/edit/questionSequence'
import questionSets from '../config/edit/questionSets'
import incidentDetailsConfig, { QUESTION_ID, REASON } from '../config/edit/incidentDetailsConfig'
import relocationAndInjuriesConfig, {
  QUESTION_ID as RAIQID,
  RELOCATION_LOCATION_DESCRIPTION,
  RELOCATION_TYPE_DESCRIPTION,
} from '../config/edit/relocationAndInjuriesConfig'
import { excludeEmptyValuesThenTrim } from '../utils/utils'
import { LoggedInUser } from '../types/uof'
import { PersistData } from './editReports/types/reportEditServiceTypes'
import compareIncidentDetailsEditWithReport from './editReports/incidentDetails'
import compareRelocationAndInjuriesEditWithReport from './editReports/relocationAndInjuries'

import ReportService from './reportService'
import logger from '../../log'
import EditIncidentDetailsService from './editIncidentDetailsService'
import EditRelocationAndInjuriesService from './editRelocationAndInjuriesService'
import AuthService from './authService'
import LocationService from './locationService'

type errors = {
  href: string
  text: string
}

export default class ReportEditService {
  constructor(
    private readonly reportService: ReportService,
    private readonly editIncidentDetailsService: EditIncidentDetailsService,
    private readonly editRelocationAndInjuriesService: EditRelocationAndInjuriesService,
    private readonly locationService: LocationService,
    private readonly authService: AuthService
  ) {}

  // used to format the output for the /reason-for-changes page
  async constructChangesToView(username: string, reportSection: { section: string }, changes = []) {
    let response = []

    if (reportSection?.section === incidentDetailsConfig.SECTION) {
      response = await this.editIncidentDetailsService.buildIncidentDetails(
        username,
        questionSets[reportSection.section],
        changes
      )
    }

    if (reportSection?.section === relocationAndInjuriesConfig.SECTION) {
      response = await this.editRelocationAndInjuriesService.buildDetails(questionSets[reportSection.section], changes)
    }
    // add similar ifs for the other page

    return response
  }

  compareEditsWithReport({ report, valuesToCompareWithReport: valuesFromRequestBody, reportSection }) {
    switch (reportSection) {
      case incidentDetailsConfig.SECTION:
        return compareIncidentDetailsEditWithReport(report, valuesFromRequestBody)

      case relocationAndInjuriesConfig.SECTION:
        return compareRelocationAndInjuriesEditWithReport(report, valuesFromRequestBody)

      // add more sections as needed
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
    }

    if (data.reportSection.section === relocationAndInjuriesConfig.SECTION) {
      updatedSection = Object.values(RAIQID).reduce((acc, current) => {
        return { ...acc, [current]: pageInput[current] }
      }, {})
    }

    // do new if blocks for the other sections of the report here

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
        pageInput.incidentDate || null
      )
    } catch (e) {
      logger.error(`Could not persist changes to report ${parseInt(data.reportId, 10)}. ${e}`)
      throw e
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateReasonForChangeInput(input: {
    reason: string
    reasonText: string
    reasonAdditionalInfo: string
    reportSection: any
  }): errors[] {
    const allErrors = []
    const { reason, anotherReason } = reasonForChangeErrorMessageConfig[input.reportSection.section]

    if (!input.reason) {
      allErrors.push({
        href: '#reason',
        text: reason,
      })
    }
    if (input.reason === 'anotherReasonForEdit' && !input.reasonText) {
      allErrors.push({
        href: '#reasonText',
        text: anotherReason,
      })
    }
    if (!input.reasonAdditionalInfo) {
      allErrors.push({
        href: '#reasonAdditionalInfo',
        text: 'Provide additional information to explain the changes you are making',
      })
    }
    return allErrors
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

  // these handlers convert dates, locationIds, prisonIds, nested objects etc to the values to be displayed in EDIT-HISTORY page
  async applyCorrectFormat(k, v, user) {
    const handlers = {
      //  handlers for incident-details
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

      //  handlers for Relocation and Injuries
      [RAIQID.PRISONER_RELOCATION]: () => RELOCATION_LOCATION_DESCRIPTION[v],
      [RAIQID.RELOCATION_TYPE]: () => RELOCATION_TYPE_DESCRIPTION[v],
      [RAIQID.RELOCATION_COMPLIANCY]: () => (v === true ? 'Yes' : 'No'),
      [RAIQID.HEALTHCARE_INVOLVED]: () => (v === true ? 'Yes' : 'No'),
      [RAIQID.PRISONER_HOSPITALISATION]: () => (v === true ? 'Yes' : 'No'),
      [RAIQID.STAFF_MEDICAL_ATTENTION]: () => (v === true ? 'Yes' : 'No'),
      [RAIQID.PRISONER_INJURIES]: () => (v === true ? 'Yes' : 'No'),

      [RAIQID.STAFF_NEEDING_MEDICAL_ATTENTION]: () =>
        Array.isArray(v) && v.length > 0
          ? v.map(obj => (obj.hospitalisation ? `${obj.name} (hospitalised)` : obj.name)).join(', ')
          : '',
    }

    const handler = handlers[k]
    //  check if a handler exists for a particular question. Otherwise return the input value as-is
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
