import R from 'ramda'
import type { Request, RequestHandler } from 'express'
import { PrisonLocation } from '../../data/prisonClientTypes'
import { AddStaffResult, InvolvedStaffService } from '../../services/involvedStaffService'
import { isNilOrEmpty, firstItem, getChangedValues } from '../../utils/utils'
import getIncidentDate from '../../utils/getIncidentDate'
import { paths, full } from '../../config/incident'
import { ReportStatus, UofReasons } from '../../config/types'
import ReportService from '../../services/reportService'
import ReviewService from '../../services/reviewService'
import OffenderService from '../../services/offenderService'
import UserService from '../../services/userService'
import StatementService from '../../services/statementService'
import AuthService from '../../services/authService'
import type ReportDataBuilder from '../../services/reportDetailBuilder'
import LocationService from '../../services/locationService'
import { processInput } from '../../services/validation'
import ReportEditService from '../../services/reportEditService'
import log from '../../../log'
import incidentDetailsConfig from '../../config/edit/incidentDetailsConfig'
import relocationAndInjuriesConfig, { QUESTION_ID as RAIQID } from '../../config/edit/relocationAndInjuriesConfig'
import evidenceConfig, { QUESTION_ID as EQID } from '../../config/edit/evidenceConfig'
import reasonsForUofConfig from '../../config/edit/reasonsForUoFConfig'
import useOfForceDetailsConfig, { QUESTION_ID as UOFDQID } from '../../config/edit/useOfForceDetailsConfig'

import * as types from '../../config/types'

const extractReportId = (req: Request): number => parseInt(req.params.reportId, 10)

export default class CoordinatorRoutes {
  constructor(
    private readonly reportService: ReportService,
    private readonly involvedStaffService: InvolvedStaffService,
    private readonly reviewService: ReviewService,
    private readonly offenderService: OffenderService,
    private readonly userService: UserService,
    private readonly statementService: StatementService,
    private readonly authService: AuthService,
    private readonly locationService: LocationService,
    private readonly reportDetailBuilder: ReportDataBuilder,
    private readonly reportEditService: ReportEditService
  ) {}

  viewEditReport: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const { user } = res.locals
    const systemToken = await this.authService.getSystemClientToken(user.username)
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const data = await this.reportDetailBuilder.build(res.locals.user.username, report)
    const reportEdits = await this.reviewService.getReportEdits(parseInt(reportId, 10))
    const hasReportBeenEdited = reportEdits?.length > 0
    const lastEdit = hasReportBeenEdited ? reportEdits.at(-1) : null
    const newReportOwners = reportEdits?.filter(edit => edit.reportOwnerChanged)
    const hasReportOwnerChanged = newReportOwners?.length > 0
    const reportOwner = newReportOwners?.at(-1)
    data.bookingId = null
    const dataWithEdits = { ...data, hasReportBeenEdited, lastEdit, hasReportOwnerChanged, reportOwner }
    const statements = await this.reviewService.getStatements(systemToken, parseInt(reportId, 10))
    const submittedStatements = statements.filter(stmnt => stmnt.isSubmitted)

    return res.render('pages/coordinator/edit-report.njk', {
      data: dataWithEdits,
      user,
      statements: submittedStatements,
    })
  }

  viewEditIncidentDetails: RequestHandler = async (req, res) => {
    req.flash('changes') // clear out any old data
    const { reportId } = req.params
    const newPrison = req.query['new-prison']
    const systemToken = await this.authService.getSystemClientToken(res.locals.user.username)
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const incidentLocationsInPersistedPrison = await this.locationService.getIncidentLocations(
      systemToken,
      report.agencyId
    )
    const { incidentDetails } = await this.reportDetailBuilder.build(res.locals.user.username, report)

    // use reportId to determine the user inputs to be displayed
    // this will prevent user-input carry-over if user starts edit on new report prior to completing edit of last report
    const flashedReportId = req.flash('reportId')
    const userInput = flashedReportId[0] === reportId ? req.flash('inputsForEditIncidentDetails') : []
    const input = firstItem(userInput)

    const incidentDate = getIncidentDate(incidentDetails.incidentDate, input?.incidentDate)
    const pageData = input || incidentDetails

    let newPrisonDetails = null // newPrison refers to the one selected via the /edit-prison page
    let incidentLocationsInNewPrison: PrisonLocation[] = null

    if (newPrison) {
      try {
        newPrisonDetails = await this.locationService.getPrisonById(systemToken, newPrison.toString())
        incidentLocationsInNewPrison = await this.locationService.getIncidentLocations(
          systemToken,
          newPrison.toString()
        )
      } catch (error) {
        log.error(`User attempted to obtain details for prison ${newPrison}`)
      }
    }

    const data = {
      ...pageData,
      reportId,
      witnesses: input?.witnesses || report.form.incidentDetails.witnesses,
      displayName: incidentDetails.offenderName,
      incidentDate,
      locations: incidentLocationsInNewPrison || incidentLocationsInPersistedPrison,
      prison: newPrisonDetails || incidentDetails.prison,
      newAgencyId: newPrison,
      offenderDetail,
    }

    const errors = req.flash('errors')

    return res.render('pages/coordinator/incident-details.njk', {
      data,
      errors,
      showSaveAndReturnButton: false,
      coordinatorEditJourney: true,
      noChangeError: req.flash('noChangeError'),
    })
  }

  submitEditIncidentDetails: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const pageInput = req.body
    req.flash('reportId') // clear out any old values
    req.flash('reportId', reportId)

    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const { payloadFields, extractedFields, errors } = processInput({
      validationSpec: full.incidentDetails,
      input: pageInput,
    })

    if (!isNilOrEmpty(errors)) {
      req.flash('errors', errors)
      return res.redirect(req.originalUrl)
    }

    pageInput.incidentDate = extractedFields.incidentDate.value
    req.flash('pageInput') // clear out first
    req.flash('pageInput', pageInput)

    req.flash('inputsForEditIncidentDetails', {
      ...payloadFields,
      incidentDate: extractedFields.incidentDate,
      reportId,
    })

    const valuesToCompareWithReport = {
      incidentDate: extractedFields.incidentDate.value,
      newAgencyId: req.body.newAgencyId,
      incidentLocationId: payloadFields.incidentLocationId,
      plannedUseOfForce: payloadFields.plannedUseOfForce,
      authorisedBy: payloadFields.authorisedBy,
      witnesses: payloadFields.witnesses,
    }

    // compare page data with original report
    const comparison = this.reportEditService.compareEditsWithReport({
      report,
      valuesToCompareWithReport,
      reportSection: incidentDetailsConfig.SECTION,
    })

    // pull out only the data that has changed
    const changedValues = getChangedValues(comparison, (value: { hasChanged: boolean }) => value.hasChanged === true)

    // if nothing has changed, redirect back with an error message
    if (R.isEmpty(changedValues)) {
      const errorSummary = [
        {
          href: '#cancelCoordinatorEdit',
          text: "You must change something or select 'Cancel' to return to the use of force incident page",
        },
      ]
      req.flash('errors', errorSummary)
      req.flash('noChangeError', 'true')
      return res.redirect('incident-details')
    }

    const sanitisedChangedValues = this.reportEditService.removeHasChangedKey(changedValues)
    req.flash('changes') // clear out first
    req.flash('changes', sanitisedChangedValues)

    const sectionDetails = {
      text: 'the incident details',
      section: incidentDetailsConfig.SECTION,
    }
    req.flash('sectionDetails') // clear out first
    req.flash('sectionDetails', sectionDetails)

    req.flash('backlinkHref') // clear out first
    req.flash('backlinkHref', 'incident-details')

    return res.redirect('reason-for-change')
  }

  viewEditPrison: RequestHandler = async (req, res) => {
    const systemToken = await this.authService.getSystemClientToken(res.locals.user.username)
    const prisons = await this.locationService.getPrisons(systemToken)

    const errors = req.flash('errors')

    return res.render('pages/coordinator/prison.njk', { errors, prisons })
  }

  submitEditPrison: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const { agencyId, submit } = req.body
    const error = [
      {
        text: 'What prison did the use of force take place in?',
        href: '#agencyId',
      },
    ]

    if (submit === 'cancel') {
      return res.redirect(`/${reportId}/edit-report/incident-details`)
    }

    if (!agencyId) {
      req.flash('errors', error)
      return res.redirect(req.originalUrl)
    }

    req.flash('newPrison', [{ agencyId: req.body.agencyId }])

    return res.redirect(`/${reportId}/edit-report/incident-details?new-prison=${req.body.agencyId}`)
  }

  viewEditWhyWasUOFApplied: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const input = report.form.reasonsForUseOfForce.reasons

    const data = {
      UofReasons,
      types,
      offenderDetail,
      reasons: input,
      reportId,
    }

    const errors = req.flash('errors')

    return res.render('pages/coordinator/why-uof-applied.njk', {
      data,
      errors,
      showSaveAndReturnButton: false,
      coordinatorEditJourney: true,
      noChangeError: req.flash('noChangeError'),
    })
  }

  submitEditWhyWasUOFApplied: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const { reasons } = req.body

    req.flash('reportId') // clear out any old values
    req.flash('reportId', reportId)

    const report = await this.reviewService.getReport(parseInt(reportId, 10))

    if (!reasons) {
      req.flash('errors', [{ href: '#reasons', text: 'Select the reasons why use of force was applied' }])
      return res.redirect(req.originalUrl)
    }

    req.flash('whyWasUOFAppliedReasons')
    req.flash('whyWasUOFAppliedReasons', reasons)

    // compare page data with original report
    const comparison = this.reportEditService.compareEditsWithReport({
      report,
      valuesToCompareWithReport: { reasons },
      reportSection: reasonsForUofConfig.SECTION,
    })

    // pull out only the data that has changed
    const changedValues = getChangedValues(comparison, (value: { hasChanged: boolean }) => value.hasChanged === true)

    req.flash('whyWasUOFAppliedChanges')
    req.flash('whyWasUOFAppliedChanges', changedValues)

    return reasons.length > 1
      ? res.redirect('what-was-the-primary-reason-of-uof')
      : res.redirect('use-of-force-details')
  }

  viewEditPrimaryReasonForUof: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const whyWasUOFAppliedReasons = req.flash('whyWasUOFAppliedReasons')
    req.flash('whyWasUOFAppliedReasons', whyWasUOFAppliedReasons)

    const primaryReason = req.flash('primaryReason')[0]

    const data = {
      primaryReason: report.form.reasonsForUseOfForce.primaryReason,
      reasons: Object.values(UofReasons).filter(({ value }) => whyWasUOFAppliedReasons.includes(value)),
      offenderDetail,
      reportId,
    }

    req.flash('primaryReason', primaryReason)
    return res.render('pages/coordinator/why-uof-applied-primary-reason.njk', {
      data,
      errors: req.flash('errors'),
      showSaveAndReturnButton: false,
      coordinatorEditJourney: true,
    })
  }

  submitEditPrimaryReasonForUof: RequestHandler = async (req, res) => {
    const { primaryReason } = req.body

    if (!primaryReason) {
      req.flash('errors', [{ href: '#reasons', text: 'Select the primary reason for applying use of force' }])
      return res.redirect(req.originalUrl)
    }

    req.flash('primaryReason')
    req.flash('primaryReason', primaryReason)

    return res.redirect('use-of-force-details')
  }

  viewEditUseOfForceDetails: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const pageData = report.form.useOfForceDetails

    const data = {
      types,
      offenderDetail,
      ...pageData,
      reportId,
    }

    const errors = req.flash('errors')

    return res.render('pages/coordinator/use-of-force-details.njk', {
      data,
      errors,
      showSaveAndReturnButton: false,
      coordinatorEditJourney: true,
      noChangeError: req.flash('noChangeError'),
    })
  }

  submitEditUseOfForceDetails: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const pageInput = req.body
    req.flash('inputsForEditUseOfForceDetails')
    req.flash('inputsForEditUseOfForceDetails', pageInput)

    const report = await this.reviewService.getReport(parseInt(reportId, 10))

    // processing use-of-force-details only
    const { payloadFields, errors } = processInput({
      validationSpec: full.useOfForceDetails,
      input: pageInput,
    })

    if (!isNilOrEmpty(errors)) {
      req.flash('errors', errors)
      return res.redirect(req.originalUrl)
    }

    // handle reasons and primaryReason
    const reasons = req.flash('whyWasUOFAppliedReasons')
    req.flash('whyWasUOFAppliedReasons', reasons)

    const primaryReason = req.flash('primaryReason')[0]
    req.flash('primaryReason', primaryReason)

    const combinedReasons = { reasons, primaryReason }

    const reasonsForUofComparedWithReport = this.reportEditService.compareEditsWithReport({
      report,
      valuesToCompareWithReport: combinedReasons,
      reportSection: reasonsForUofConfig.SECTION,
    })

    req.flash('pageInputsforReasonsForUofAndPrimaryReason', combinedReasons)

    // create an object of all the possible values that cross-match  useOfForceDetails
    const uofDetailsComparedToReport = Object.values(UOFDQID).reduce((acc, current) => {
      return { ...acc, [current]: payloadFields[current] }
    }, {})

    // compare inputs to /use-of-force-details with persisted report
    const uofDetailsComparedWithPersistedReport = this.reportEditService.compareEditsWithReport({
      report,
      valuesToCompareWithReport: uofDetailsComparedToReport,
      reportSection: useOfForceDetailsConfig.SECTION,
    })

    // extract the data that has changed for useOfForceDetails
    const changedValuesForUofDetails = getChangedValues(
      uofDetailsComparedWithPersistedReport,
      (value: { hasChanged: boolean }) => value.hasChanged === true
    )

    const changesToUofDetails = this.reportEditService.removeHasChangedKey(changedValuesForUofDetails)

    // extract data that has changed for reasonsForUseOfForce
    const changedValuesForReasons = getChangedValues(
      reasonsForUofComparedWithReport,
      (value: { hasChanged: boolean }) => value.hasChanged === true
    )

    const changesToReasonsForUof = this.reportEditService.removeHasChangedKey(changedValuesForReasons)

    // if nothing has changed in either reasons, primary reason or details, redirect back with an error message
    if (R.isEmpty({ ...changedValuesForUofDetails, ...changedValuesForReasons })) {
      const errorSummary = [
        {
          href: '#cancelCoordinatorEdit',
          text: "You must change something or select 'Cancel' to return to the use of force incident page",
        },
      ]
      req.flash('errors', errorSummary)
      req.flash('noChangeError', 'true')
      return res.redirect('use-of-force-details')
    }

    // clear flash first
    req.flash('pageInput')
    req.flash('changes')
    req.flash('sectionDetails')
    req.flash('backlinkHref')

    // these will be persisted to report-edit
    const changedReasonsAndDetailsValuesToBePersistedToReportEdit = {
      changesToUofDetails,
      changesToReasonsForUof,
    }

    req.flash('changesForReportEdit', changedReasonsAndDetailsValuesToBePersistedToReportEdit)

    // the following are for display in reason-for-change
    req.flash('changesToUofDetails')
    req.flash('changesToUofDetails', changesToUofDetails)

    req.flash('changesToReasonsForUof')
    req.flash('changesToReasonsForUof', changesToReasonsForUof)
    req.flash('changes', { ...changesToReasonsForUof, ...changesToUofDetails })

    req.flash('backlinkHref', 'use-of-force-details')

    const sectionDetails = {
      text: 'use of force details',
      section: useOfForceDetailsConfig.SECTION,
    }

    req.flash('payloadFields', payloadFields)
    req.flash('sectionDetails', sectionDetails)

    return res.redirect('reason-for-change')
  }

  viewEditRelocationAndInjuries: RequestHandler = async (req, res) => {
    req.flash('changes') // clear out any old data
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const userInput = req.flash('reportId')[0] === reportId ? req.flash('inputsForEditRelocationAndInjuries') : []
    const input = firstItem(userInput) // there will only be input if user 'back buttons' from submitEditRelocationAndInjuries
    const pageData = input || report.form.relocationAndInjuries // pageData is either the new inputs or the data currently in report

    const data = {
      types,
      offenderDetail,
      ...pageData,
      reportId,
    }

    const errors = req.flash('errors')

    return res.render('pages/coordinator/relocation-and-injuries.njk', {
      data,
      errors,
      showSaveAndReturnButton: false,
      coordinatorEditJourney: true,
      noChangeError: req.flash('noChangeError'),
    })
  }

  submitEditRelocationAndInjuries: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const pageInput = req.body

    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const { payloadFields, errors } = processInput({
      validationSpec: full.relocationAndInjuries,
      input: pageInput,
    })

    req.flash('reportId')
    req.flash('reportId', reportId)

    req.flash('inputsForEditRelocationAndInjuries', {
      ...payloadFields,
      reportId,
    })
    if (!isNilOrEmpty(errors)) {
      req.flash('errors', errors)
      return res.redirect(req.originalUrl)
    }

    // create an object containing kv pairs as follows fieldName:payloadValue
    const valuesToCompareWithReport = Object.values(RAIQID).reduce((acc, current) => {
      return { ...acc, [current]: payloadFields[current] }
    }, {})

    // compare new inputs with original report
    const comparison = this.reportEditService.compareEditsWithReport({
      report,
      valuesToCompareWithReport,
      reportSection: relocationAndInjuriesConfig.SECTION,
    })

    // extract the data that has changed
    const changedValues = getChangedValues(comparison, (value: { hasChanged: boolean }) => value.hasChanged === true)

    // if nothing has changed, redirect back with an error message
    if (R.isEmpty(changedValues)) {
      const errorSummary = [
        {
          href: '#cancelCoordinatorEdit',
          text: "You must change something or select 'Cancel' to return to the use of force incident page",
        },
      ]
      req.flash('errors', errorSummary)
      req.flash('noChangeError', 'true')
      return res.redirect('relocation-and-injuries')
    }

    // clear flash first
    req.flash('pageInput')
    req.flash('changes')
    req.flash('sectionDetails')
    req.flash('backlinkHref')

    // valuesToCompareWithReport are the page inputs after processing. One of the things Processing does is convert any 'true/false' to boolean equivalents. As such valuesToCompareWithReport, not the raw input from re.body, should be persisted to report
    const valuesToBePersistedToReport = valuesToCompareWithReport
    req.flash('pageInput', valuesToBePersistedToReport)

    const changes = this.reportEditService.removeHasChangedKey(changedValues)
    req.flash('changes', changes)

    req.flash('sectionDetails', {
      text: 'relocation and injuries',
      section: relocationAndInjuriesConfig.SECTION,
    })
    req.flash('backlinkHref', 'relocation-and-injuries')

    return res.redirect('reason-for-change')
  }

  viewEditEvidence: RequestHandler = async (req, res) => {
    req.flash('changes') // clear out any old data
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const userInput = req.flash('reportId')[0] === reportId ? req.flash('inputsForEvidence') : []
    const input = firstItem(userInput)
    const pageData = input || report.form.evidence

    const data = {
      types,
      offenderDetail,
      ...pageData,
      reportId,
    }

    const errors = req.flash('errors')

    return res.render('pages/coordinator/evidence.njk', {
      data,
      errors,
      showSaveAndReturnButton: false,
      coordinatorEditJourney: true,
      noChangeError: req.flash('noChangeError'),
    })
  }

  submitEditEvidence: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const pageInput = req.body

    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const { payloadFields, errors } = processInput({
      validationSpec: full.evidence,
      input: pageInput,
    })

    req.flash('reportId')
    req.flash('reportId', reportId)

    req.flash('inputsForEvidence', {
      ...payloadFields,
      reportId,
    })
    if (!isNilOrEmpty(errors)) {
      req.flash('errors', errors)
      return res.redirect(req.originalUrl)
    }

    // create an object containing kv pairs as follows fieldName:payloadValue
    const valuesToCompareWithReport = Object.values(EQID).reduce((acc, current) => {
      return { ...acc, [current]: payloadFields[current] }
    }, {})

    // compare new inputs with original report
    const comparison = this.reportEditService.compareEditsWithReport({
      report,
      valuesToCompareWithReport,
      reportSection: evidenceConfig.SECTION,
    })

    // extract the data that has changed
    const changedValues = getChangedValues(comparison, (value: { hasChanged: boolean }) => value.hasChanged === true)

    // if nothing has changed, redirect back with an error message
    if (R.isEmpty(changedValues)) {
      const errorSummary = [
        {
          href: '#cancelCoordinatorEdit',
          text: "You must change something or select 'Cancel' to return to the use of force incident page",
        },
      ]
      req.flash('errors', errorSummary)
      req.flash('noChangeError', 'true')
      return res.redirect('evidence')
    }

    // clear flash first
    req.flash('pageInput')
    req.flash('changes')
    req.flash('sectionDetails')
    req.flash('backlinkHref')

    const valuesToBePersistedToReport = valuesToCompareWithReport
    req.flash('pageInput', valuesToBePersistedToReport)

    const changes = this.reportEditService.removeHasChangedKey(changedValues)
    req.flash('changes', changes)

    req.flash('sectionDetails', {
      text: 'evidence',
      section: evidenceConfig.SECTION,
    })
    req.flash('backlinkHref', 'evidence')

    return res.redirect('reason-for-change')
  }

  // viewReasonForChange will be used for changes to all parts of the report
  viewReasonForChange: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const errors = req.flash('errors')
    const sectionDetails = req.flash('sectionDetails')
    const reportSection = sectionDetails[0]
    const changes = req.flash('changes')
    req.flash('changes', changes) // flash again because needed when persisting

    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const backlinkHref = req.flash('backlinkHref')
    req.flash('backlinkHref', backlinkHref)
    let data = {}

    const changesToDisplayInTheReasonsPage = await this.reportEditService.constructChangesToView(
      res.locals.user.username,
      reportSection,
      changes[0]
    )

    req.flash('sectionDetails', sectionDetails)

    data = {
      errors,
      reportSection,
      reportId,
      changes: changesToDisplayInTheReasonsPage,
      reason: req.flash('reason')[0],
      reasonText: req.flash('reasonText')[0],
      reasonAdditionalInfo: req.flash('reasonAdditionalInfo')[0],
      showBacklink: true,
      backlinkHref,
      offenderDetail,
    }

    return res.render('pages/coordinator/reason-for-change.njk', { data })
  }

  // submitReasonForChange will also be used for changes to all parts of the report
  submitReasonForChange: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const { reason, reasonText, reasonAdditionalInfo } = req.body
    const sectionDetails = req.flash('sectionDetails')
    const reportSection = sectionDetails[0]
    req.flash('sectionDetails', sectionDetails)
    const pageInput = req.flash('pageInput') // to persist in original report
    const changes = req.flash('changes') // to persist in edit-history table
    req.flash('changes', changes)
    const validationErrors = this.reportEditService.validateReasonForChangeInput({
      reason,
      reasonText,
      reasonAdditionalInfo,
      reportSection,
    })
    if (validationErrors.length > 0) {
      // clear any old values first
      req.flash('reason')
      req.flash('reasonText')
      req.flash('reasonAdditionalInfo')
      req.flash('errors')

      req.flash('reason', reason)
      req.flash('reasonText', reasonText)
      req.flash('reasonAdditionalInfo', reasonAdditionalInfo)
      req.flash('errors', validationErrors)
      return res.redirect(`/${reportId}/edit-report/reason-for-change`)
    }

    // the /use-of-force-details section requires different logic compared
    // to other sections because it also invlves the reasons and primary reason section
    if (reportSection.section === useOfForceDetailsConfig.SECTION) {
      const pageInputForReasons = req.flash('whyWasUOFAppliedReasons')
      const pageInputForPrimaryReason = req.flash('primaryReason')[0]
      const changesToUofDetails = req.flash('changesToUofDetails')
      const changesToReasonsForUof = req.flash('changesToReasonsForUof')
      const payload = req.flash('payloadFields')
      const reasonsForUofData = {
        reportSection: reasonsForUofConfig.SECTION,
        changes: changesToReasonsForUof,
        pageInputForReasons,
        pageInputForPrimaryReason,
      }

      const uofDetailsData = {
        reportSection: useOfForceDetailsConfig.SECTION,
        changes: changesToUofDetails,
        payload,
      }
      try {
        await this.reportEditService.persistChangesForReasonsAndDetails(res.locals.user, {
          reportId,
          reportSection,
          reason,
          reasonText: reason === 'anotherReasonForEdit' ? reasonText : '',
          reasonAdditionalInfo,
          reasonsForUofData,
          uofDetailsData,
        })
      } catch (error) {
        req.session.flash = {}
        log.error(`Could not persist changes for reportId ${reportId}`, error)
        throw error
      }
    } else {
      try {
        await this.reportEditService.persistChanges(res.locals.user, {
          reportId,
          pageInput,
          reportSection,
          changes,
          reason,
          reasonText: reason === 'anotherReasonForEdit' ? reasonText : '',
          reasonAdditionalInfo,
        })
      } catch (error) {
        req.session.flash = {}
        log.error(`Could not persist changes for reportId ${reportId}`, error)
        throw error
      }
    }
    req.session.flash = {}
    req.flash('edit-success-message', { reportSection })
    return res.redirect(`/${reportId}/view-incident`)
  }

  // ===========.  existing code below which will be removed at some point.  ==========
  viewRemovalRequest: RequestHandler = async (req, res) => {
    const { reportId, statementId } = req.params
    const token = await this.authService.getSystemClientToken(res.locals.user.username)
    const [{ name, userId, email }, removalRequest] = await Promise.all([
      this.involvedStaffService.loadInvolvedStaff(parseInt(reportId, 10), parseInt(statementId, 10)),
      this.involvedStaffService.getInvolvedStaffRemovalRequest(parseInt(statementId, 10)),
    ])
    const location = await this.userService.getUserLocation(token, userId)
    const data = {
      name,
      userId,
      location,
      email,
      removalReason: removalRequest.removalRequestedReason,
    }
    const errors = req.flash('errors')

    if (!removalRequest.isRemovalRequested) {
      return res.redirect(paths.viewStatements(parseInt(reportId, 10)))
    }
    return res.render('pages/coordinator/view-removal-request.html', { data, errors })
  }

  submitRemovalRequest: RequestHandler = async (req, res) => {
    const { reportId, statementId } = req.params
    const { confirm } = req.body

    if (!confirm) {
      req.flash('errors', [
        { href: '#confirm', text: 'Select yes if you want to remove this person from the incident' },
      ])
      return res.redirect(paths.viewRemovalRequest(reportId, statementId))
    }

    if (confirm === 'no') {
      await this.statementService.refuseRequest(parseInt(statementId, 10))
      return res.redirect(paths.staffMemberNotRemoved(reportId, statementId))
    }

    return res.redirect(paths.confirmStatementDelete(reportId, statementId, true))
  }

  viewStaffMemberNotRemoved: RequestHandler = async (req, res) => {
    const { reportId, statementId } = req.params
    const staffMember = await this.involvedStaffService.loadInvolvedStaff(
      parseInt(reportId, 10),
      parseInt(statementId, 10)
    )

    const data = { name: staffMember.name, email: staffMember.email, reportId }

    return res.render('pages/coordinator/staff-member-not-removed.html', { data })
  }

  viewAddInvolvedStaff: RequestHandler = async (req, res) => {
    const { reportId } = req.params

    const errors = req.flash('errors')
    const data = { incidentId: reportId }

    res.render('pages/coordinator/add-involved-staff/add-involved-staff.html', { errors, data })
  }

  submitAddInvolvedStaff: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const {
      body: { username },
    } = req

    if (!username.trim()) {
      req.flash('errors', [{ href: '#username', text: "Enter a staff member's username" }])
      return res.redirect(paths.addInvolvedStaff(reportId))
    }

    const result = await this.involvedStaffService.addInvolvedStaff(
      await this.authService.getSystemClientToken(res.locals.user.username),
      reportId,
      username
    )

    req.flash('username', username.toUpperCase())
    return res.redirect(paths.addInvolvedStaffResult(reportId, result))
  }

  viewAddInvolvedStaffResult: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const result = req.params.result as AddStaffResult
    const username = firstItem(req.flash('username'))

    const knownResult = Object.values(AddStaffResult).some(knownValue => knownValue === result)

    if (!username || !knownResult || result === AddStaffResult.SUCCESS) {
      return res.redirect(paths.viewReport(reportId))
    }

    if ([AddStaffResult.SUCCESS_UNVERIFIED, AddStaffResult.ALREADY_EXISTS].includes(result)) {
      const user = await this.involvedStaffService.loadInvolvedStaffByUsername(reportId, username)
      return res.render(`pages/coordinator/add-involved-staff/${result}.html`, {
        reportId,
        username,
        name: user.name,
      })
    }

    return res.render(`pages/coordinator/add-involved-staff/${result}.html`, { reportId, username })
  }

  confirmDeleteReport: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const errors = req.flash('errors')
    const report = await this.reviewService.getReport(reportId)

    const { bookingId, reporterName, submittedDate } = report
    const offenderDetail = await this.offenderService.getOffenderDetails(bookingId, res.locals.user.username)
    const data = { incidentId: reportId, reporterName, submittedDate, offenderDetail }

    res.render('pages/coordinator/confirm-report-deletion.html', { errors, data })
  }

  deleteReport: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const { confirm } = req.body

    if (!confirm) {
      req.flash('errors', [{ href: '#confirm', text: 'Select yes if you want to delete this report' }])
      return res.redirect(paths.confirmReportDelete(reportId))
    }

    const report = await this.reviewService.getReport(reportId)
    const referringPage =
      report.status === ReportStatus.SUBMITTED.value ? '/not-completed-incidents' : '/completed-incidents'

    if (confirm === 'yes') {
      await this.reportService.deleteReport(res.locals.user.username, reportId)
    }

    return res.redirect(referringPage)
  }

  confirmDeleteStatement: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const { statementId } = req.params
    const { removalRequest } = req.query

    const staffMember = await this.involvedStaffService.loadInvolvedStaff(reportId, parseInt(statementId, 10))

    const errors = req.flash('errors')

    const data = { reportId, statementId, displayName: staffMember.name, removalRequest }

    res.render('pages/coordinator/confirm-statement-deletion.html', { errors, data })
  }

  deleteStatement: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const { statementId } = req.params
    const { confirm, removalRequest } = req.body

    if (!confirm) {
      req.flash('errors', [{ href: '#confirm', text: 'Select yes if you want to delete this statement' }])
      return removalRequest
        ? res.redirect(paths.confirmStatementDelete(reportId, statementId, true))
        : res.redirect(paths.confirmStatementDelete(reportId, statementId, false))
    }

    if (confirm === 'yes') {
      await this.involvedStaffService.removeInvolvedStaff(reportId, parseInt(statementId, 10))
    }

    const location = removalRequest ? paths.viewStatements(reportId) : paths.viewReport(reportId)
    return res.redirect(location)
  }
}
