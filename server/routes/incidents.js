const moment = require('moment')
const { ReportStatus } = require('../config/types')
const { links } = require('../config.js')
const { properCaseFullName } = require('../utils/utils')
const reportSummary = require('./model/reportSummary')

module.exports = function CreateReportRoutes({ reportService, involvedStaffService, offenderService, reviewService }) {
  const getOffenderNames = (username, incidents) => {
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return offenderService.getOffenderNames(username, offenderNos)
  }

  const toReport = namesByOffenderNumber => incident => ({
    id: incident.id,
    bookingId: incident.bookingId,
    incidentdate: incident.incidentDate,
    staffMemberName: incident.reporterName,
    isOverdue: incident.isOverdue,
    offenderName: namesByOffenderNumber[incident.offenderNo],
  })

  const buildReportData = async (report, req, res) => {
    const { id, form, incidentDate, bookingId, reporterName, submittedDate } = report
    const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.username, bookingId)
    const { description: locationDescription = '' } = await offenderService.getLocation(
      req.user.username,
      form.incidentDetails.locationId
    )
    const involvedStaff = await involvedStaffService.getInvolvedStaff(id)
    const involvedStaffNames = involvedStaff.map(staff => [`${properCaseFullName(staff.name)} - ${staff.userId}`])

    return {
      incidentId: id,
      reporterName,
      submittedDate,
      bookingId,
      ...reportSummary(form, offenderDetail, locationDescription, involvedStaffNames, incidentDate),
    }
  }

  return {
    redirectToHomePage: async (req, res) => {
      const location = res.locals.user.isReviewer ? '/all-incidents' : '/your-statements'
      res.redirect(location)
    },

    viewReportSent: async (req, res) => {
      res.render('pages/report-sent', { data: res.locals.formObject, reportId: req.params.reportId, links })
    },

    viewAllIncidents: async (req, res) => {
      if (!res.locals.user.isReviewer) {
        return res.redirect('/')
      }

      const { awaiting, completed } = await reviewService.getReports(res.locals.user.activeCaseLoadId)

      const namesByOffenderNumber = await getOffenderNames(req.user.username, [...awaiting, ...completed])
      const awaitingReports = awaiting.map(toReport(namesByOffenderNumber))
      const completedReports = completed.map(toReport(namesByOffenderNumber))

      return res.render('pages/all-incidents', {
        awaitingReports,
        completedReports,
        selectedTab: 'all-incidents',
        links,
      })
    },

    viewYourReports: async (req, res) => {
      const awaiting = await reportService.getReports(req.user.username, [ReportStatus.IN_PROGRESS])
      const completed = await reportService.getReports(req.user.username, [
        ReportStatus.SUBMITTED,
        ReportStatus.COMPLETE,
      ])

      const namesByOffenderNumber = await getOffenderNames(req.user.username, [...awaiting, ...completed])
      const awaitingReports = awaiting.map(toReport(namesByOffenderNumber))
      const completedReports = completed.map(toReport(namesByOffenderNumber))

      res.render('pages/your-reports', {
        awaitingReports,
        completedReports,
        selectedTab: 'your-reports',
        links,
      })
    },

    viewYourReport: async (req, res) => {
      const { reportId } = req.params
      const report = await reportService.getReport(req.user.username, reportId)

      if (!report) {
        throw new Error(`Report does not exist: ${reportId}`)
      }

      const data = await buildReportData(report, req, res)

      return res.render('pages/your-report', { data })
    },

    reviewReport: async (req, res) => {
      const { reportId } = req.params

      if (!res.locals.user.isReviewer) {
        return res.redirect('/')
      }

      const report = await reviewService.getReport(reportId)

      const data = await buildReportData(report, req, res)

      return res.render('pages/reviewer/view-report', { data })
    },

    reviewStatements: async (req, res) => {
      if (!res.locals.user.isReviewer) {
        return res.redirect('/')
      }

      const { reportId } = req.params

      const report = await reviewService.getReport(reportId)

      const { bookingId, reporterName, submittedDate } = report
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.username, bookingId)

      const statements = await reviewService.getStatements(reportId)

      const data = { reportId, reporterName, submittedDate, offenderDetail, statements }
      return res.render('pages/reviewer/view-statements', { data })
    },

    reviewStatement: async (req, res) => {
      if (!res.locals.user.isReviewer) {
        return res.redirect('/')
      }

      const { statementId } = req.params

      const statement = await reviewService.getStatement(statementId)

      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.username, statement.bookingId)
      const { displayName, offenderNo } = offenderDetail

      return res.render('pages/reviewer/view-statement', {
        data: {
          displayName,
          offenderNo,
          ...statement,
          lastTrainingMonth: moment.months(statement.lastTrainingMonth),
        },
      })
    },
  }
}
