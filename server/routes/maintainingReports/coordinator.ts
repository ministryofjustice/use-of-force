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
import reasonForAddingStaffForm from '../../config/forms/reasonForAddingStaffForm'

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
    req.session.edit = {} // initialise session.edit
    return res.render('pages/coordinator/edit-report.njk', {
      data: dataWithEdits,
      user,
      statements: submittedStatements,
    })
  }

  viewDeleteIncident: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const errors = req.flash('errors')

    return res.render('pages/coordinator/delete-incident.njk', {
      data: {
        reportId,
        offenderDetail,
        confirmation: this.getIncidentReportSession(req, reportId, 'confirmation'),
      },
      errors,
    })
  }

  submitDeleteIncident: RequestHandler = async (req, res) => {
    const { confirmation } = req.body
    const { reportId } = req.params

    if (!confirmation) {
      req.flash('errors', [{ href: '#confirmation', text: 'Confirm whether you want to delete this incident' }])
      return res.redirect(req.originalUrl)
    }

    this.setIncidentReportSession(req, reportId, { confirmation })

    return confirmation === 'yes'
      ? res.redirect('reason-for-deleting-report')
      : res.redirect('/not-completed-incidents')
  }

  viewReasonForDeletingIncident: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const errors = req.flash('errors')

    return res.render('pages/coordinator/delete-incident-reason.njk', {
      data: {
        reportId,
        offenderDetail,
        reasonForDelete: this.getIncidentReportSession(req, reportId, 'reasonForDelete'),
        reasonForDeleteText: this.getIncidentReportSession(req, reportId, 'reasonForDeleteText'),
      },
      errors,
    })
  }

  submitReasonForDeletingIncident: RequestHandler = async (req, res, next) => {
    const { reportId } = req.params
    const { reasonForDelete, reasonForDeleteText } = req.body
    const validationErrors = this.reportEditService.validateReasonForDeleteInput({
      reasonForDelete,
      reasonForDeleteText,
    })

    if (validationErrors.length > 0) {
      req.flash('errors', validationErrors)
      this.setIncidentReportSession(req, reportId, { reasonForDelete, reasonForDeleteText })
      return res.redirect(`/${reportId}/reason-for-deleting-report`)
    }

    await this.reportEditService.persistDeleteIncident(res.locals.user, {
      reportId: parseInt(reportId, 10),
      reasonForDelete,
      reasonForDeleteText,
      changes: { reportDeleted: { oldValue: false, newValue: true, question: 'Incident report deleted' } },
    })

    // delete flash and session data
    req.session.flash = undefined
    this.removeIncidentReportSession(req, reportId)
    return res.redirect(`/${reportId}/delete-incident-success`)
  }

  viewDeleteIncidentSuccess: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const bookingId = await this.reviewService.getBookingIdWithReportId(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(
      parseInt(bookingId, 10),
      res.locals.user.username
    )

    return res.render('pages/coordinator/delete-incident-success.njk', {
      data: {
        reportId,
        offenderDetail,
      },
    })
  }

  viewEditIncidentDetails: RequestHandler = async (req, res) => {
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
    const userInput = req.session.edit.inputsForEditIncidentDetails
    const incidentDate = getIncidentDate(incidentDetails.incidentDate, userInput?.incidentDate)
    const pageData = userInput || incidentDetails

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
      witnesses: userInput?.witnesses || report.form.incidentDetails.witnesses,
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

    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const { payloadFields, extractedFields, errors } = processInput({
      validationSpec: full.incidentDetails,
      input: pageInput,
    })

    pageInput.incidentDate = extractedFields.incidentDate.value

    req.session.edit.pageInput = pageInput

    req.session.edit.inputsForEditIncidentDetails = {
      ...payloadFields,
      incidentDate: extractedFields.incidentDate,
      reportId,
    }

    if (!isNilOrEmpty(errors)) {
      req.flash('errors', errors)
      return res.redirect(req.originalUrl)
    }
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

    const changedValues = getChangedValues(comparison, (value: { hasChanged: boolean }) => value.hasChanged === true)

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

    req.session.edit.changes = this.reportEditService.removeHasChangedKey(changedValues)

    req.session.edit.sectionDetails = {
      text: 'the incident details',
      section: incidentDetailsConfig.SECTION,
    }

    req.session.edit.backlinkHref = 'incident-details'

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
    const persistedUseOfForceReasons = report.form.reasonsForUseOfForce?.reasons || []
    // eslint-disable-next-line prefer-destructuring
    const reasons = req.session.edit?.reasons

    const errors = req.flash('errors')
    let whyWasUOFAppliedReasons = []
    if (errors.length === 0) whyWasUOFAppliedReasons = reasons || persistedUseOfForceReasons

    const data = {
      UofReasons,
      types,
      offenderDetail,
      reasons: whyWasUOFAppliedReasons,
      reportId,
    }

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
    const report = await this.reviewService.getReport(parseInt(reportId, 10))

    if (!reasons) {
      req.flash('errors', [{ href: '#reasons', text: 'Select the reasons why use of force was applied' }])
      return res.redirect(req.originalUrl)
    }

    req.session.edit.reasons = reasons

    // compare page data with original report
    const comparison = this.reportEditService.compareEditsWithReport({
      report,
      valuesToCompareWithReport: { reasons },
      reportSection: reasonsForUofConfig.SECTION,
    })

    // pull out only the data that has changed
    const changedValues = getChangedValues(comparison, (value: { hasChanged: boolean }) => value.hasChanged === true)
    req.session.edit.whyWasUOFAppliedChanges = changedValues

    return reasons.length > 1
      ? res.redirect('what-was-the-primary-reason-of-uof')
      : res.redirect('use-of-force-details')
  }

  viewEditPrimaryReasonForUof: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const { reasons } = req.session.edit
    const persistedPrimaryReason = report.form.reasonsForUseOfForce?.primaryReason
    const primaryReasonInSession = req.session.edit.primaryReason

    const data = {
      primaryReason: primaryReasonInSession || persistedPrimaryReason,
      reasons: Object.values(UofReasons).filter(({ value }) => reasons.includes(value)),
      offenderDetail,
      reportId,
    }

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
      req.flash('errors', [{ href: '#primaryReason', text: 'Select the primary reason for applying use of force' }])
      return res.redirect(req.originalUrl)
    }

    req.session.edit.primaryReason = primaryReason
    return res.redirect('use-of-force-details')
  }

  viewEditUseOfForceDetails: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const useOfForceDetailsPersistedData = report.form.useOfForceDetails
    const { reasons } = req.session.edit
    const backLinkHref =
      reasons?.length > 1
        ? `/${reportId}/edit-report/what-was-the-primary-reason-of-uof`
        : `/${reportId}/edit-report/why-was-uof-applied`

    const useOfForceDetailsInSession = req.session.edit.useOfForceDetails
    const inputData = useOfForceDetailsInSession || useOfForceDetailsPersistedData

    const data = {
      types,
      offenderDetail,
      ...inputData,
      reportId,
      backLinkHref,
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
    const report = await this.reviewService.getReport(parseInt(reportId, 10))

    const { payloadFields, errors } = processInput({
      validationSpec: full.useOfForceDetails,
      input: pageInput,
    })

    req.session.edit.useOfForceDetails = payloadFields

    if (!isNilOrEmpty(errors)) {
      req.flash('errors', errors)
      return res.redirect(req.originalUrl)
    }
    const { reasons, primaryReason } = req.session.edit

    const combinedReasons = { reasons, primaryReason }

    const reasonsForUofComparedWithReport = this.reportEditService.compareEditsWithReport({
      report,
      valuesToCompareWithReport: combinedReasons,
      reportSection: reasonsForUofConfig.SECTION,
    })

    req.session.edit.pageInputsforReasonsForUofAndPrimaryReason = combinedReasons

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

    // these will be persisted to report-edit
    const changedReasonsAndDetailsValuesToBePersistedToReportEdit = {
      changesToUofDetails,
      changesToReasonsForUof,
    }

    req.session.edit.changesForReportEdit = changedReasonsAndDetailsValuesToBePersistedToReportEdit
    req.session.edit.changesToUofDetails = changesToUofDetails
    req.session.edit.changesToReasonsForUof = changesToReasonsForUof
    req.session.edit.changes = { ...changesToReasonsForUof, ...changesToUofDetails }
    req.session.edit.backlinkHref = 'use-of-force-details'

    const sectionDetails = {
      text: 'use of force details',
      section: useOfForceDetailsConfig.SECTION,
    }

    req.session.edit.payloadFields = payloadFields
    req.session.edit.sectionDetails = sectionDetails

    return res.redirect('reason-for-change')
  }

  viewEditRelocationAndInjuries: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const pageData = req.session.edit.inputsForEditRelocationAndInjuries || report.form.relocationAndInjuries // pageData is either the new inputs or the data currently in report

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

    req.session.edit.inputsForEditRelocationAndInjuries = {
      ...payloadFields,
      reportId,
    }

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

    // valuesToCompareWithReport are the page inputs after processing. One of the things Processing does is convert any 'true/false' to boolean equivalents. As such valuesToCompareWithReport, not the raw input from re.body, should be persisted to report
    const valuesToBePersistedToReport = valuesToCompareWithReport

    req.session.edit.pageInput = valuesToBePersistedToReport

    const changes = this.reportEditService.removeHasChangedKey(changedValues)
    req.session.edit.changes = changes

    req.session.edit.sectionDetails = {
      text: 'relocation and injuries',
      section: relocationAndInjuriesConfig.SECTION,
    }

    req.session.edit.backlinkHref = 'relocation-and-injuries'

    return res.redirect('reason-for-change')
  }

  viewEditEvidence: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const pageData = req.session.edit.inputsForEvidence || report.form.evidence

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

    req.session.edit.inputsForEvidence = { ...payloadFields, reportId }

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

    const valuesToBePersistedToReport = valuesToCompareWithReport
    req.session.edit.pageInput = valuesToBePersistedToReport

    const changes = this.reportEditService.removeHasChangedKey(changedValues)
    req.session.edit.changes = changes

    req.session.edit.sectionDetails = {
      text: 'evidence',
      section: evidenceConfig.SECTION,
    }

    req.session.edit.backlinkHref = 'evidence'

    return res.redirect('reason-for-change')
  }

  // viewReasonForChange will be used for changes to many parts of the report
  viewReasonForChange: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const errors = req.flash('errors')
    const { sectionDetails } = req.session.edit
    const { changes } = req.session.edit

    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    // eslint-disable-next-line prefer-destructuring
    const backlinkHref = req.session.edit.backlinkHref
    let data = {}

    const changesToDisplayInTheReasonsPage = await this.reportEditService.constructChangesToView(
      res.locals.user.username,
      sectionDetails,
      changes
    )

    data = {
      errors,
      reportSection: { text: sectionDetails.text },
      reportId,
      changes: changesToDisplayInTheReasonsPage,
      reason: req.session.edit.reason,
      reasonText: req.session.edit.reasonText,
      reasonAdditionalInfo: req.session.edit.reasonAdditionalInfo,
      showBacklink: true,
      backlinkHref,
      offenderDetail,
    }

    return res.render('pages/coordinator/reason-for-change.njk', { data })
  }

  // submitReasonForChange will also be used for changes to many parts of the report
  submitReasonForChange: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const { reason, reasonText, reasonAdditionalInfo } = req.body
    const { sectionDetails } = req.session.edit
    const reportSection = sectionDetails

    const { pageInput } = req.session.edit // to persist in original report
    const { changes } = req.session.edit // to persist in edit-history table
    const validationErrors = this.reportEditService.validateReasonForChangeInput({
      reason,
      reasonText,
      reasonAdditionalInfo,
      reportSection,
    })
    if (validationErrors.length > 0) {
      req.flash('errors', validationErrors)
      req.session.edit.reason = reason
      req.session.edit.reasonText = reasonText
      req.session.edit.reasonAdditionalInfo = reasonAdditionalInfo
      return res.redirect(`/${reportId}/edit-report/reason-for-change`)
    }

    // the /use-of-force-details section requires different logic compared
    // to other sections because it also involves the reasons and primary reason section
    if (reportSection.section === useOfForceDetailsConfig.SECTION) {
      const pageInputForReasons = req.session.edit.reasons
      const pageInputForPrimaryReason = req.session.edit.primaryReason

      const { changesToUofDetails } = req.session.edit
      const { changesToReasonsForUof } = req.session.edit
      const payload = req.session.edit.useOfForceDetails
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

  viewInvolvedStaff: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)

    const report = await this.reviewService.getReport(reportId)
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const reportData = await this.reportDetailBuilder.build(report.username, report)
    const { staffInvolved } = reportData.incidentDetails

    const errors = req.flash('errors')
    const data = {
      reportId,
      username: report.username,
      staffInvolved,
      offenderDetail,
      displaySuccessBanner: req.flash('result')[0] === 'success',
      bannerMessage: req.flash('resultMessage')[0],
    }

    return res.render('pages/coordinator/staff-involved.njk', {
      data,
      errors,
      showSaveAndReturnButton: false,
      coordinatorEditJourney: true,
      noChangeError: req.flash('noChangeError'),
    })
  }

  viewInvolvedStaffSearch: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const page = parseInt(req.query.page as string, 10) || 0

    const errors = req.flash('errors')
    const flashUsername = req.flash('username')[0]
    const queryUsername = req.query.username as string
    const username = flashUsername || queryUsername || ''

    const userSearchResultsRaw = req.flash('userSearchResults')[0]
    let userSearchResults: any = { content: [] }
    let content: any[] = []

    if (userSearchResultsRaw) {
      try {
        userSearchResults = JSON.parse(userSearchResultsRaw)
        content = userSearchResults?.content || []
      } catch {
        userSearchResults = { content: [] }
        content = []
      }
    } else if (username) {
      // Re-perform search for pagination
      userSearchResults = await this.involvedStaffService.findInvolvedStaffFuzzySearch(
        await this.authService.getSystemClientToken(res.locals.user.username),
        parseInt(reportId, 10),
        username,
        page
      )
      content = userSearchResults?.content || []
    }

    await Promise.all(
      content.map(async staffMember => {
        try {
          const isExistingInvolvedStaffMember = await this.involvedStaffService.loadInvolvedStaffByUsername(
            parseInt(reportId, 10),
            staffMember.username
          )

          if (isExistingInvolvedStaffMember) {
            Object.assign(staffMember, { isExistingInvolvedStaffMember: true })
          }
        } catch (error) {
          // Log the error for debugging, but continue processing others
          log.error(
            `Error checking involved staff member ${staffMember.username} for report ${reportId}: ${error.message}`,
            error
          )
        }
      })
    )

    const { number: currentPage = 0, totalPages = 1, totalElements = 0, size = 10 } = userSearchResults
    const start = currentPage * size + 1
    const end = start + content.length - 1

    const paginationMeta = {
      page: currentPage,
      totalPages,
      previousPage: currentPage > 0 ? currentPage : 0,
      nextPage: currentPage + 1 < totalPages ? currentPage + 1 : undefined,
      totalCount: totalElements,
      min: start,
      max: end,
    }

    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const data = {
      reportId,
      username,
      userSearchResults,
      offenderDetail,
      paginationMeta,
      baseUrl: paths.viewInvolvedStaffSearch(reportId),
    }

    return res.render('pages/coordinator/edit-add-involved-staff.njk', {
      data,
      errors,
      showSaveAndReturnButton: false,
      coordinatorEditJourney: true,
      noChangeError: req.flash('noChangeError'),
    })
  }

  submitInvolvedStaffSearch: RequestHandler = async (req, res) => {
    const page = 0
    const reportId = extractReportId(req)
    const {
      body: { username },
    } = req

    if (!username.trim()) {
      req.flash('errors', [{ href: '#username', text: "Enter a person's name, email address or user ID" }])
      return res.redirect(paths.viewInvolvedStaffSearch(reportId))
    }

    const results = await this.involvedStaffService.findInvolvedStaffFuzzySearch(
      await this.authService.getSystemClientToken(res.locals.user.username),
      reportId,
      username,
      page
    )

    if (results.totalElements === undefined || results.totalElements === 0) {
      return res.redirect(paths.viewNoResultsFoundInvolvedStaffSearch(reportId))
    }

    req.flash('username', username)
    req.flash('userSearchResults', JSON.stringify(results))

    return res.redirect(`${paths.viewInvolvedStaffSearch(reportId)}?page=0&username=${username}`)
  }

  viewNoResultsFoundInvolvedStaffSearch: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const data = {
      reportId,
      offenderDetail,
    }

    return res.render('pages/coordinator/no-results-edit-add-involved-staff.njk', {
      data,
      showSaveAndReturnButton: false,
      coordinatorEditJourney: true,
      noChangeError: req.flash('noChangeError'),
    })
  }

  editViewAddNewInvolvedStaffMember: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const systemToken = await this.authService.getSystemClientToken(res.locals.user.username)
    const staffMember = await this.userService.getUser(systemToken, req.params.username) // call api to get staff member details

    const data = {
      reportId,
      offenderDetail,
      username: staffMember,
    }

    return res.render('pages/coordinator/reason-for-adding-this-person.njk', {
      data,
      showSaveAndReturnButton: false,
      coordinatorEditJourney: true,
      noChangeError: req.flash('noChangeError'),
      backlinkHref: paths.viewInvolvedStaffSearch(reportId),
    })
  }

  submitAddNewInvolvedStaffMember: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const { username } = req.params
    const pageInput = req.body

    // Validate input using Joi schema
    const { errors } = processInput({
      validationSpec: reasonForAddingStaffForm.complete,
      input: pageInput,
    })

    if (!isNilOrEmpty(errors)) {
      // Re-render form with errors and previous input
      const report = await this.reviewService.getReport(reportId)
      const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
      const systemToken = await this.authService.getSystemClientToken(res.locals.user.username)
      const staffMember = await this.userService.getUser(systemToken, username)
      const data = {
        reportId,
        offenderDetail,
        username: staffMember,
        ...pageInput,
        errors,
      }
      return res.render('pages/coordinator/reason-for-adding-this-person.njk', {
        data,
        showSaveAndReturnButton: false,
        coordinatorEditJourney: true,
        noChangeError: req.flash('noChangeError'),
      })
    }

    // Add staff member if validation passes
    const result = await this.involvedStaffService.addInvolvedStaff(
      await this.authService.getSystemClientToken(res.locals.user.username),
      reportId,
      username
    )

    // Handle result - display appropriate alert message
    switch (result) {
      case AddStaffResult.SUCCESS:
      case AddStaffResult.SUCCESS_UNVERIFIED: {
        const edits = {
          username: res.locals.user.username,
          displayName: res.locals.user.displayName,
          reportId,
          changes: {
            oldValue: 'the list of involved staff',
            newValue: 'the new list of involved staff',
            question: 'Staff involved',
          },
          reason: pageInput.reason,
          reasonText: pageInput.reason === 'anotherReasonForEdit' ? pageInput.reasonText : '',
          reasonAdditionalInfo: pageInput.reasonAdditionalInfo,
          reportOwnerChanged: false,
        }

        await this.involvedStaffService.updateReportEditWithInvolvedStaff(edits)

        const staffMember = await this.involvedStaffService.loadInvolvedStaffByUsername(reportId, username)
        const successMessage = `You have added ${staffMember.name} (${staffMember.userId.toUpperCase()}) to the incident. You can see your changes on the edit history tab of the incident report.`
        req.flash('result', 'success')
        req.flash('resultMessage', successMessage)
        break
      }
      case AddStaffResult.ALREADY_EXISTS: {
        const existingStaffMember = await this.involvedStaffService.loadInvolvedStaffByUsername(reportId, username)
        const alreadyExistsMessage = `${existingStaffMember.name} (${existingStaffMember.userId.toUpperCase()}) is already added to the incident.`
        req.flash('result', 'success')
        req.flash('resultMessage', alreadyExistsMessage)
        break
      }
      default: {
        req.flash('result', 'error')
        req.flash('resultMessage', 'An unexpected error occurred while adding the staff member.')
        break
      }
    }

    return res.redirect(paths.viewInvolvedStaff(reportId))
  }

  viewAddInvolvedStaff: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const errors = req.flash('errors')
    const data = { reportId }

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

  getIncidentReportSession(req, reportId, key) {
    if (!req.session.incidentReport || !Array.isArray(req.session.incidentReport)) return undefined
    const reportSessionEntry = req.session.incidentReport.find(entry => entry.reportId === reportId)
    return reportSessionEntry ? reportSessionEntry[key] : undefined
  }

  setIncidentReportSession(req, reportId, values = {}) {
    if (!req.session.incidentReport || !Array.isArray(req.session.incidentReport)) req.session.incidentReport = []
    const reportSessionIndex = req.session.incidentReport.findIndex(entry => entry.reportId === reportId)
    if (reportSessionIndex >= 0) {
      req.session.incidentReport[reportSessionIndex] = {
        ...req.session.incidentReport[reportSessionIndex],
        ...values,
      }
    } else {
      req.session.incidentReport.push({ reportId, ...values })
    }
  }

  removeIncidentReportSession(req, reportId) {
    if (!req.session.incidentReport || !Array.isArray(req.session.incidentReport)) return
    req.session.incidentReport = req.session.incidentReport.filter(entry => entry.reportId !== reportId)
  }
}
