import R from 'ramda'
import type { Request, Response, RequestHandler } from 'express'
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
import reasonForAddingStaffForm from '../../config/forms/reasonForAddingStaffForm'

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
    const reportId = extractReportId(req)
    const reportEditOrDeletePermitted = await this.reportEditService.isIncidentDateWithinEditPeriod(reportId)
    if (!reportEditOrDeletePermitted) {
      return res.redirect(`/${reportId}/view-incident?tab=report`)
    }

    const { user } = res.locals
    const systemToken = await this.authService.getSystemClientToken(user.username)
    const report = await this.reviewService.getReport(reportId)
    const data = await this.reportDetailBuilder.build(res.locals.user.username, report)
    const reportEdits = await this.reviewService.getReportEdits(reportId)
    const hasReportBeenEdited = reportEdits?.length > 0
    const lastEdit = hasReportBeenEdited ? reportEdits[0] : null
    const newReportOwners = reportEdits?.filter(edit => edit.reportOwnerChanged)
    const hasReportOwnerChanged = newReportOwners?.length > 0
    const reportOwner = newReportOwners?.at(-1)
    data.bookingId = null
    const dataWithEdits = { ...data, hasReportBeenEdited, lastEdit, hasReportOwnerChanged, reportOwner }
    const statements = await this.reviewService.getStatements(systemToken, reportId)
    const submittedStatements = statements.filter(stmnt => stmnt.isSubmitted)
    return res.render('pages/coordinator/edit-report.njk', {
      data: dataWithEdits,
      user,
      statements: submittedStatements,
    })
  }

  viewDeleteIncident: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const reportEditOrDeletePermitted = await this.reportEditService.isIncidentDateWithinEditPeriod(reportId)
    if (!reportEditOrDeletePermitted) {
      return res.redirect(`/${reportId}/view-incident?tab=report`)
    }

    const report = await this.reviewService.getReport(reportId)
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const errors = req.flash('errors')

    const sessionData = this.getIncidentReportSession(req, reportId)
    return res.render('pages/coordinator/delete-incident.njk', {
      data: {
        reportId,
        offenderDetail,
        confirmation: sessionData?.confirmation,
      },
      errors,
    })
  }

  submitDeleteIncident: RequestHandler = async (req, res) => {
    const { confirmation } = req.body
    const reportId = extractReportId(req)

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
    const reportId = extractReportId(req)
    const reportEditOrDeletePermitted = await this.reportEditService.isIncidentDateWithinEditPeriod(reportId)
    if (!reportEditOrDeletePermitted) {
      return res.redirect(`/${reportId}/view-incident?tab=report`)
    }

    const report = await this.reviewService.getReport(reportId)
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const errors = req.flash('errors')

    const sessionData = this.getIncidentReportSession(req, reportId)
    return res.render('pages/coordinator/delete-incident-reason.njk', {
      data: {
        reportId,
        offenderDetail,
        reasonForDelete: sessionData?.reasonForDelete,
        reasonForDeleteText: sessionData?.reasonForDeleteText,
      },
      errors,
    })
  }

  submitReasonForDeletingIncident: RequestHandler = async (req, res, next) => {
    const reportId = extractReportId(req)
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
      reportId,
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
    const reportId = extractReportId(req)
    const bookingId = await this.reviewService.getBookingIdWithReportId(reportId)
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
    const reportId = extractReportId(req)
    const reportEditOrDeletePermitted = await this.reportEditService.isIncidentDateWithinEditPeriod(reportId)
    if (!reportEditOrDeletePermitted) {
      return res.redirect(`/${reportId}/view-incident?tab=report`)
    }

    const newPrison = req.query['new-prison']
    const systemToken = await this.authService.getSystemClientToken(res.locals.user.username)
    const report = await this.reviewService.getReport(reportId)
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const incidentLocationsInPersistedPrison = await this.locationService.getIncidentLocations(
      systemToken,
      report.agencyId
    )
    const { incidentDetails } = await this.reportDetailBuilder.build(res.locals.user.username, report)
    const sessionData = this.getIncidentReportSession(req, reportId)
    const userInput = sessionData?.inputsForEditIncidentDetails
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
    const reportId = extractReportId(req)
    const pageInput = req.body

    const report = await this.reviewService.getReport(reportId)
    const { payloadFields, extractedFields, errors } = processInput({
      validationSpec: full.incidentDetails,
      input: pageInput,
    })

    pageInput.incidentDate = extractedFields.incidentDate.value

    const inputsForEditIncidentDetails = {
      ...payloadFields,
      incidentDate: extractedFields.incidentDate,
      reportId,
    }

    this.setIncidentReportSession(req, reportId, { pageInput, inputsForEditIncidentDetails })

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

    const changes = this.reportEditService.removeHasChangedKey(changedValues)
    const sectionDetails = {
      text: 'the incident details',
      section: incidentDetailsConfig.SECTION,
    }
    const backlinkHref = 'incident-details'
    this.setIncidentReportSession(req, reportId, { changes, sectionDetails, backlinkHref })

    return res.redirect('reason-for-change')
  }

  viewEditPrison: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const reportEditOrDeletePermitted = await this.reportEditService.isIncidentDateWithinEditPeriod(reportId)
    if (!reportEditOrDeletePermitted) {
      return res.redirect(`/${reportId}/view-incident?tab=report`)
    }

    const systemToken = await this.authService.getSystemClientToken(res.locals.user.username)
    const prisons = await this.locationService.getPrisons(systemToken)

    const errors = req.flash('errors')

    return res.render('pages/coordinator/prison.njk', { errors, prisons })
  }

  submitEditPrison: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
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
    const reportId = extractReportId(req)
    const reportEditOrDeletePermitted = await this.reportEditService.isIncidentDateWithinEditPeriod(reportId)

    if (!reportEditOrDeletePermitted) {
      return res.redirect(`/${reportId}/view-incident?tab=report`)
    }

    const report = await this.reviewService.getReport(reportId)
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const persistedUseOfForceReasons = report.form.reasonsForUseOfForce?.reasons || []
    const reasons = this.getIncidentReportSession(req, reportId)?.reasons

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
    const reportId = extractReportId(req)
    const { reasons } = req.body
    const report = await this.reviewService.getReport(reportId)

    if (!reasons) {
      req.flash('errors', [{ href: '#reasons', text: 'Select the reasons why use of force was applied' }])
      return res.redirect(req.originalUrl)
    }

    this.setIncidentReportSession(req, reportId, { reasons: Array.isArray(reasons) ? reasons : [reasons] })

    // compare page data with original report
    const comparison = this.reportEditService.compareEditsWithReport({
      report,
      valuesToCompareWithReport: { reasons },
      reportSection: reasonsForUofConfig.SECTION,
    })

    // pull out only the data that has changed
    const changedValues = getChangedValues(comparison, (value: { hasChanged: boolean }) => value.hasChanged === true)

    this.setIncidentReportSession(req, reportId, { whyWasUOFAppliedChanges: changedValues })

    return reasons.length > 1
      ? res.redirect('what-was-the-primary-reason-of-uof')
      : res.redirect('use-of-force-details')
  }

  viewEditPrimaryReasonForUof: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const reportEditOrDeletePermitted = await this.reportEditService.isIncidentDateWithinEditPeriod(reportId)
    if (!reportEditOrDeletePermitted) {
      return res.redirect(`/${reportId}/view-incident?tab=report`)
    }

    const report = await this.reviewService.getReport(reportId)
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const sessionData = this.getIncidentReportSession(req, reportId) || {}
    const reasons = sessionData?.reasons || []
    const persistedPrimaryReason = report.form.reasonsForUseOfForce?.primaryReason
    const primaryReasonInSession = sessionData?.primaryReason

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
    const reportId = extractReportId(req)

    if (!primaryReason) {
      req.flash('errors', [{ href: '#primaryReason', text: 'Select the primary reason for applying use of force' }])
      return res.redirect(req.originalUrl)
    }

    this.setIncidentReportSession(req, reportId, { primaryReason })
    return res.redirect('use-of-force-details')
  }

  viewEditUseOfForceDetails: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const reportEditOrDeletePermitted = await this.reportEditService.isIncidentDateWithinEditPeriod(reportId)
    if (!reportEditOrDeletePermitted) {
      return res.redirect(`/${reportId}/view-incident?tab=report`)
    }

    const report = await this.reviewService.getReport(reportId)
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const useOfForceDetailsPersistedData = report.form.useOfForceDetails
    const reasons = this.getIncidentReportSession(req, reportId)?.reasons || []
    const backLinkHref =
      reasons.length > 1
        ? `/${reportId}/edit-report/what-was-the-primary-reason-of-uof`
        : `/${reportId}/edit-report/why-was-uof-applied`

    const userInput = this.getIncidentReportSession(req, reportId)?.useOfForceDetails
    const pageData = userInput || useOfForceDetailsPersistedData

    const data = {
      types,
      offenderDetail,
      ...pageData,
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
    const reportId = extractReportId(req)
    const pageInput = req.body
    const report = await this.reviewService.getReport(reportId)

    const { payloadFields, errors } = processInput({
      validationSpec: full.useOfForceDetails,
      input: pageInput,
    })

    this.setIncidentReportSession(req, reportId, { useOfForceDetails: payloadFields })

    if (!isNilOrEmpty(errors)) {
      req.flash('errors', errors)
      return res.redirect(req.originalUrl)
    }

    const { reasons, primaryReason } = this.getIncidentReportSession(req, reportId) || {}
    const combinedReasons = { reasons, primaryReason }
    const reasonsForUofComparedWithReport = this.reportEditService.compareEditsWithReport({
      report,
      valuesToCompareWithReport: combinedReasons,
      reportSection: reasonsForUofConfig.SECTION,
    })

    this.setIncidentReportSession(req, reportId, { pageInputsforReasonsForUofAndPrimaryReason: combinedReasons })

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

    const sectionDetails = {
      text: 'use of force details',
      section: useOfForceDetailsConfig.SECTION,
    }

    this.setIncidentReportSession(req, reportId, {
      changesForReportEdit: changedReasonsAndDetailsValuesToBePersistedToReportEdit,
      changesToUofDetails,
      changesToReasonsForUof,
      changes: { ...changesToReasonsForUof, ...changesToUofDetails },
      backlinkHref: 'use-of-force-details',
      payloadFields,
      sectionDetails,
    })

    return res.redirect('reason-for-change')
  }

  viewEditRelocationAndInjuries: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const reportEditOrDeletePermitted = await this.reportEditService.isIncidentDateWithinEditPeriod(reportId)
    if (!reportEditOrDeletePermitted) {
      return res.redirect(`/${reportId}/view-incident?tab=report`)
    }

    const report = await this.reviewService.getReport(reportId)
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const sessionData = this.getIncidentReportSession(req, reportId)
    const userInput = sessionData?.inputsForEditRelocationAndInjuries
    const pageData = userInput || report.form.relocationAndInjuries // pageData is either the new inputs or the data currently in report

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
    const reportId = extractReportId(req)
    const pageInput = req.body

    const report = await this.reviewService.getReport(reportId)
    const { payloadFields, errors } = processInput({
      validationSpec: full.relocationAndInjuries,
      input: pageInput,
    })

    this.setIncidentReportSession(req, reportId, { inputsForEditRelocationAndInjuries: payloadFields })

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

    const changes = this.reportEditService.removeHasChangedKey(changedValues)
    const sectionDetails = {
      text: 'relocation and injuries',
      section: relocationAndInjuriesConfig.SECTION,
    }
    const backlinkHref = 'relocation-and-injuries'

    this.setIncidentReportSession(req, reportId, {
      pageInput: valuesToBePersistedToReport,
      changes,
      sectionDetails,
      backlinkHref,
    })

    return res.redirect('reason-for-change')
  }

  viewEditEvidence: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const reportEditOrDeletePermitted = await this.reportEditService.isIncidentDateWithinEditPeriod(reportId)
    if (!reportEditOrDeletePermitted) {
      return res.redirect(`/${reportId}/view-incident?tab=report`)
    }

    const report = await this.reviewService.getReport(reportId)
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
    const sessionData = this.getIncidentReportSession(req, reportId)
    const userInput = sessionData?.inputsForEvidence
    const pageData = userInput || report.form.evidence // pageData is either the new inputs or the data currently in report

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
    const reportId = extractReportId(req)
    const pageInput = req.body

    const report = await this.reviewService.getReport(reportId)
    const { payloadFields, errors } = processInput({
      validationSpec: full.evidence,
      input: pageInput,
    })

    this.setIncidentReportSession(req, reportId, { inputsForEvidence: payloadFields })

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
    const changes = this.reportEditService.removeHasChangedKey(changedValues)
    const sectionDetails = {
      text: 'evidence',
      section: evidenceConfig.SECTION,
    }
    const backlinkHref = 'evidence'
    this.setIncidentReportSession(req, reportId, {
      pageInput: valuesToBePersistedToReport,
      changes,
      sectionDetails,
      backlinkHref,
    })

    return res.redirect('reason-for-change')
  }

  // viewReasonForChange will be used for changes to many parts of the report
  viewReasonForChange: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const reportEditOrDeletePermitted = await this.reportEditService.isIncidentDateWithinEditPeriod(reportId)

    if (!reportEditOrDeletePermitted) {
      return res.redirect(`/${reportId}/view-incident?tab=report`)
    }

    const errors = req.flash('errors')
    const sessionData = this.getIncidentReportSession(req, reportId)
    const sectionDetails = sessionData?.sectionDetails
    const changes = sessionData?.changes
    const backlinkHref = sessionData?.backlinkHref
    const reason = sessionData?.reason
    const reasonText = sessionData?.reasonText
    const reasonAdditionalInfo = sessionData?.reasonAdditionalInfo
    const report = await this.reviewService.getReport(reportId)
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)
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
      reason,
      reasonText,
      reasonAdditionalInfo,
      showBacklink: true,
      backlinkHref,
      offenderDetail,
    }

    return res.render('pages/coordinator/reason-for-change.njk', { data })
  }

  // submitReasonForChange will also be used for changes to many parts of the report
  submitReasonForChange: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const { reason, reasonText, reasonAdditionalInfo } = req.body
    const sessionData = this.getIncidentReportSession(req, reportId)
    const sectionDetails = sessionData?.sectionDetails
    const reportSection = sectionDetails

    const pageInput = sessionData?.pageInput // to persist in original report
    const changes = sessionData?.changes // to persist in edit-history table

    const { errors, sanitizedInputValues } = this.reportEditService.validateReasonForChangeInput({
      reason,
      reasonText,
      reasonAdditionalInfo,
      reportSection,
    })

    if (errors.length > 0) {
      req.flash('errors', errors)
      this.setIncidentReportSession(req, reportId, {
        reason,
        reasonText: sanitizedInputValues.reasonText,
        reasonAdditionalInfo: sanitizedInputValues.reasonAdditionalInfo,
      })
      return res.redirect(`/${reportId}/edit-report/reason-for-change`)
    }

    // the /use-of-force-details section requires different logic compared
    // to other sections because it also involves the reasons and primary reason section
    if (reportSection.section === useOfForceDetailsConfig.SECTION) {
      const pageInputForReasons = this.getIncidentReportSession(req, reportId)?.reasons
      const pageInputForPrimaryReason = this.getIncidentReportSession(req, reportId)?.primaryReason
      const {
        changesToUofDetails,
        changesToReasonsForUof,
        useOfForceDetails: payload,
      } = this.getIncidentReportSession(req, reportId)

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
          reasonText: reason === 'anotherReasonForEdit' ? sanitizedInputValues.reasonText : '',
          reasonAdditionalInfo: sanitizedInputValues.reasonAdditionalInfo,
        })
      } catch (error) {
        req.session.flash = {}
        log.error(`Could not persist changes for reportId ${reportId}`, error)
        throw error
      }
    }
    req.session.flash = {}
    this.removeIncidentReportSession(req, reportId)
    req.flash('edit-success-message', { reportSection })
    return res.redirect(`/${reportId}/view-incident`)
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
      displayAddedInvolvedStaffSuccessBanner: req.flash('result')[0] === 'success',
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
    const reportId = extractReportId(req)
    const page = parseInt(req.query.page as string, 10) || 0

    const errors = req.flash('errors')
    const flashUsername = req.flash('username')[0]
    const queryUsername = req.query.username as string
    const username = flashUsername || queryUsername || ''

    const userSearchResultsRaw = req.flash('userSearchResults')[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let userSearchResults: any = { content: [] }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        reportId,
        username,
        page
      )
      content = userSearchResults?.content || []
    }

    await Promise.all(
      content.map(async staffMember => {
        try {
          const isExistingInvolvedStaffMember = await this.involvedStaffService.loadInvolvedStaffByUsername(
            reportId,
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

    const report = await this.reviewService.getReport(reportId)
    const offenderDetail = await this.offenderService.getOffenderDetails(report.bookingId, res.locals.user.username)

    const usernameValue = username || ''
    const data = {
      reportId,
      username,
      userSearchResults,
      offenderDetail,
      paginationMeta,
      baseUrl: paths.viewInvolvedStaffSearch(reportId),
      queryParams: {
        currentPage,
        username: usernameValue,
      },
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
    const { page, username } = req.query

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
      backlinkHref: paths.viewInvolvedStaffSearch(reportId) + (page ? `?page=${page}&username=${username}` : ''),
    })
  }

  submitAddNewInvolvedStaffMember: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const { username } = req.params
    const pageInput = req.body
    const { page, username: searchedUsername } = req.query

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
        backlinkHref:
          paths.viewInvolvedStaffSearch(reportId) + (page ? `?page=${page}&username=${searchedUsername}` : ''),
      })
    }

    // Add staff member if validation passes - addInvolvedStaff / updateWithNewInvolvedStaff
    const result = await this.involvedStaffService.updateWithNewInvolvedStaff(
      await this.authService.getSystemClientToken(res.locals.user.username),
      reportId,
      username,
      res.locals.user.displayName,
      pageInput
    )

    // Handle result - display appropriate alert message
    switch (result) {
      case AddStaffResult.SUCCESS:
      case AddStaffResult.SUCCESS_UNVERIFIED: {
        const staffMember = await this.involvedStaffService.loadInvolvedStaffByUsername(reportId, username)
        const successMessage = `You have added ${staffMember.name} (${staffMember.userId.toUpperCase()}) to the incident. You can see your changes on the <a class="govuk-link" href="/${reportId}/view-incident?tab=edit-history" data-qa="success-banner-edit-history-link">edit history</a> tab of the incident report.`
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

  getIncidentReportSession(req, reportId) {
    if (!req.session.incidentReport || !Array.isArray(req.session.incidentReport)) return undefined
    return req.session.incidentReport.find(entry => entry.reportId === reportId)
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
