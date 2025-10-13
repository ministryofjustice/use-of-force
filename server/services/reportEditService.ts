import moment from 'moment'
import { ControlAndRestraintPosition, PainInducingTechniquesUsed } from '../config/types'

import reasonForChangeErrorMessageConfig from '../config/edit/reasonForChangeErrorMessageConfig'
import sequence from '../config/edit/questionSequence'
import questionSets from '../config/edit/questionSets'
import incidentDetailsConfig, { QUESTION_ID, REASON } from '../config/edit/incidentDetailsConfig'
import relocationAndInjuriesConfig, {
  QUESTION_ID as RAIQID,
  RELOCATION_LOCATION_DESCRIPTION,
  RELOCATION_TYPE_DESCRIPTION,
} from '../config/edit/relocationAndInjuriesConfig'
import evidenceConfig, { QUESTION_ID as EQID } from '../config/edit/evidenceConfig'
import reasonsForUoFConfig, { QUESTION_ID as RFUOFQID, REASON_DESCRIPTION } from '../config/edit/reasonsForUoFConfig'
import useOfForceDetailsConfig, { QUESTION_ID as UOFDQID } from '../config/edit/useOfForceDetailsConfig'
import { excludeEmptyValuesThenTrim } from '../utils/utils'
import { LoggedInUser } from '../types/uof'
import { PersistData } from './editReports/types/reportEditServiceTypes'
import compareIncidentDetailsEditWithReport from './editReports/incidentDetails'
import compareRelocationAndInjuriesEditWithReport from './editReports/relocationAndInjuries'
import compareEvidenceWithReport from './editReports/evidence'
import compareReasonsForUofWithReport from './editReports/reasonsForUseOfForce'
import compareUseOfForceDetailsWithReport from './editReports/useOfForceDetails'
import ReportService from './reportService'
import logger from '../../log'
import EditIncidentDetailsService from './editIncidentDetailsService'
import EditRelocationAndInjuriesService from './editRelocationAndInjuriesService'
import EditEvidenceService from './editEvidenceService'
import EditUseOfForceDetailsService from './editUseOfForceDetailsService'
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
    private readonly editEvidenceService: EditEvidenceService,
    private readonly editUseOfForceDetailsService: EditUseOfForceDetailsService,
    private readonly locationService: LocationService,
    private readonly authService: AuthService
  ) {}

  // used to format the output for the REASON-FOR-CHANGE page
  async constructChangesToView(username: string, reportSection: { section: string }, changes = []) {
    let response = []

    if (reportSection?.section === incidentDetailsConfig.SECTION) {
      response = await this.editIncidentDetailsService.buildIncidentDetails(
        username,
        questionSets[reportSection.section],
        changes
      )
    }

    if (reportSection?.section === reasonsForUoFConfig.SECTION) {
      response = await this.editUseOfForceDetailsService.buildDetails(questionSets[reportSection.section], changes)
    }

    if (reportSection?.section === useOfForceDetailsConfig.SECTION) {
      const combinedSections = { ...questionSets[reportSection.section], ...questionSets.reasonsForUseOfForce }
      response = await this.editUseOfForceDetailsService.buildDetails(combinedSections, changes)
    }

    if (reportSection?.section === relocationAndInjuriesConfig.SECTION) {
      response = await this.editRelocationAndInjuriesService.buildDetails(questionSets[reportSection.section], changes)
    }

    if (reportSection?.section === evidenceConfig.SECTION) {
      response = await this.editEvidenceService.buildDetails(questionSets[reportSection.section], changes)
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

      case evidenceConfig.SECTION:
        return compareEvidenceWithReport(report, valuesFromRequestBody)

      case reasonsForUoFConfig.SECTION:
        return compareReasonsForUofWithReport(report, valuesFromRequestBody)

      case useOfForceDetailsConfig.SECTION:
        return compareUseOfForceDetailsWithReport(report, valuesFromRequestBody)

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

  async persistChangesForReasonsAndDetails(user: LoggedInUser, data): Promise<void> {
    const formSections = {
      [data.reasonsForUofData.reportSection]: {
        changes: data.reasonsForUofData.changes,
        payload: {
          reasons: data.reasonsForUofData.pageInputForReasons,
          primaryReason: data.reasonsForUofData.pageInputForPrimaryReason,
        },
      },
      [data.uofDetailsData.reportSection]: {
        changes: data.uofDetailsData.changes,
        payload: Object.values(UOFDQID).reduce((acc, current) => {
          return { ...acc, [current]: data.uofDetailsData.payload[current] }
        }, {}),
      },
    }

    try {
      await this.reportService.updateTwoReportSections(user, {
        reportId: parseInt(data.reportId, 10),
        reason: data.reason,
        reasonText: data.reasonText,
        reasonAdditionalInfo: data.reasonAdditionalInfo,
        formSections,
        keys: [data.reasonsForUofData.reportSection, data.uofDetailsData.reportSection],
      })
    } catch (e) {
      logger.error(`Could not persist changes to report ${parseInt(data.reportId, 10)}. ${e}`)
      throw e
    }
  }

  async persistChanges(user: LoggedInUser, data: PersistData): Promise<void> {
    const { pageInput } = data
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

    // relocationAndInjuriesConfig
    if (data.reportSection.section === relocationAndInjuriesConfig.SECTION) {
      updatedSection = Object.values(RAIQID).reduce((acc, current) => {
        return { ...acc, [current]: pageInput[current] }
      }, {})
    }

    // evidenceConfig
    if (data.reportSection.section === evidenceConfig.SECTION) {
      updatedSection = Object.values(EQID).reduce((acc, current) => {
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

      // handler for Uof reasons
      [RFUOFQID.REASONS]: () => v.map(i => REASON_DESCRIPTION[i]).join(', '),

      // handler for Uof primary reason
      [RFUOFQID.PRIMARY_REASON]: () => REASON_DESCRIPTION[v],

      // handlers for use of force details
      [UOFDQID.POSITIVE_COMMUNICATION]: () => (v === true ? 'Yes' : 'No'),
      [UOFDQID.POSITIVE_COMMUNICATION]: () => (v === true ? 'Yes' : 'No'),
      [UOFDQID.BODY_WORN_CAMERAS]: () => (v === 'YES' ? 'Yes' : 'No'),
      [UOFDQID.BODY_WORN_CAMERA_NUMBERS]: () => (v ? v.map(cam => cam.cameraNum).join(', ') : ''),
      [UOFDQID.PERSONAL_PROTECTION_TECHNIQUES]: () => (v === true ? 'Yes' : 'No'),
      [UOFDQID.BATON_DRAWN_AGAINST_PRISONER]: () => (v === true ? 'Yes' : 'No'),
      [UOFDQID.BATON_USED]: () => (v === true ? 'Yes' : 'No'),
      [UOFDQID.PAVA_DRAWN_AGAINST_PRISONER]: () => (v === true ? 'Yes' : 'No'),
      [UOFDQID.PAVA_USED]: () => (v === true ? 'Yes' : 'No'),
      [UOFDQID.TASER_DRAWN]: () => (v === true ? 'Yes' : 'No'),
      [UOFDQID.TASER_OPERATIVE_PRESENT]: () => this.toYesNoFalsy(v),
      [UOFDQID.RED_DOT_WARNING]: () => this.toYesNoFalsy(v),
      [UOFDQID.ARC_WARNING_USED]: () => this.toYesNoFalsy(v),
      [UOFDQID.TASER_DEPLOYED]: () => this.toYesNoFalsy(v),
      [UOFDQID.TASER_CYCLE_EXTENDED]: () => this.toYesNoFalsy(v),
      [UOFDQID.TASER_REENERGISED]: () => this.toYesNoFalsy(v),
      [UOFDQID.BITTEN_BY_PRISON_DOG]: () => (v === true ? 'Yes' : 'No'),
      [UOFDQID.WEAPONS_OBSERVED]: () => (v === 'YES' ? 'Yes' : 'No'),
      [UOFDQID.WEAPON_TYPES]: () => (v ? v.map(weapon => weapon.weaponType).join(', ') : ''),
      [UOFDQID.GUIDING_HOLD]: () => (v === true ? 'Yes' : 'No'),
      [UOFDQID.ESCORTING_HOLD]: () => (v === true ? 'Yes' : 'No'),
      [UOFDQID.RESTRAINT_POSITIONS]: () =>
        this.formatDisplayOfRestraintAndPainInducingQuestions(
          v,
          ControlAndRestraintPosition,
          'No control and restraint positions were used'
        ),
      [UOFDQID.PAIN_INDUCING_TECHNIQUES_USED]: () =>
        this.formatDisplayOfRestraintAndPainInducingQuestions(
          v,
          PainInducingTechniquesUsed,
          'No pain inducing techniques were used'
        ),
      [UOFDQID.HANDCUFFS_APPLIED]: () => (v === true ? 'Yes' : 'No'),

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

      //  handlers for Evidence
      [EQID.BAGGED_EVIDENCE]: () => (v === true ? 'Yes' : 'No'),
      [EQID.EVIDENCE_TAG_AND_DESCRIPTION]: () => this.editEvidenceService.evidenceTagAndDescriptionDisplay(v),
      [EQID.PHOTOGRAPHS_TAKEN]: () => (v === true ? 'Yes' : 'No'),
      [EQID.CCTV_RECORDING]: () => this.editEvidenceService.toYesNoNotKnown(v),
    }

    const handler = handlers[k]
    //  check if a handler exists for a particular question. Otherwise return the input value as-is
    return handler ? handler() : v
  }

  toYesNoFalsy(v) {
    if (v === true) return 'Yes'
    if (v === false) return 'No'
    return ''
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

  formatDisplayOfRestraintAndPainInducingQuestions(inputValue, labelSet, noneMessage): string {
    if (inputValue !== 'NONE') {
      const valArray = Array.isArray(inputValue) ? inputValue : [inputValue]
      const labels = valArray.map(v => labelSet[v].label)
      return labels.length === 1 ? labels[0] : `${labels[0]}: ${labels.slice(1).join(', ')}`
    }
    return noneMessage
  }
}
