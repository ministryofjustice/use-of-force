const { ReportStatus } = require('../config/types')
const { links } = require('../config.js')
const { properCaseFullName } = require('../utils/utils')
const reportSummary = require('./model/reportSummary')

module.exports = function CreateReportRoutes({ reportService, involvedStaffService, offenderService }) {
  const getOffenderNames = (token, incidents) => {
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return offenderService.getOffenderNames(token, offenderNos)
  }

  const toReport = namesByOffenderNumber => incident => ({
    id: incident.id,
    bookingId: incident.bookingId,
    incidentdate: incident.incidentDate,
    staffMemberName: incident.reporterName,
    isOverdue: incident.isOverdue,
    offenderName: namesByOffenderNumber[incident.offenderNo],
  })

  const buildReportData = async (report, res) => {
    const { id, form, incidentDate, bookingId, reporterName, submittedDate } = report
    const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, bookingId)
    const { description: locationDescription = '' } = await offenderService.getLocation(
      res.locals.user.token,
      form.incidentDetails.locationId
    )
    const involvedStaff = await involvedStaffService.getInvolvedStaff(id)
    const involvedStaffNames = involvedStaff.map(staff => [`${properCaseFullName(staff.name)} - ${staff.userId}`])

    return {
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

      const { awaiting, completed } = await reportService.getReportsForReviewer(res.locals.user.activeCaseLoadId)

      const namesByOffenderNumber = await getOffenderNames(res.locals.user.token, [...awaiting, ...completed])
      const awaitingReports = awaiting.map(toReport(namesByOffenderNumber))
      const completedReports = completed.map(toReport(namesByOffenderNumber))

      return res.render('pages/all-incidents', {
        awaitingReports,
        completedReports,
        selectedTab: 'all-incidents',
      })
    },

    viewYourReports: async (req, res) => {
      const awaiting = await reportService.getReports(req.user.username, [ReportStatus.IN_PROGRESS])
      const completed = await reportService.getReports(req.user.username, [
        ReportStatus.SUBMITTED,
        ReportStatus.COMPLETE,
      ])

      const namesByOffenderNumber = await getOffenderNames(res.locals.user.token, [...awaiting, ...completed])
      const awaitingReports = awaiting.map(toReport(namesByOffenderNumber))
      const completedReports = completed.map(toReport(namesByOffenderNumber))

      res.render('pages/your-reports', {
        awaitingReports,
        completedReports,
        selectedTab: 'your-reports',
      })
    },

    viewYourReport: async (req, res) => {
      const { reportId } = req.params
      const report = await reportService.getReport(req.user.username, reportId)

      if (!report) {
        throw new Error(`Report does not exist: ${reportId}`)
      }

      const data = await buildReportData(report, res)

      return res.render('pages/your-report', { data })
    },

    reviewReport: async (req, res) => {
      const { reportId } = req.params

      if (!res.locals.user.isReviewer) {
        return res.redirect('/')
      }

      const report = await reportService.getReportForReviewer(reportId)

      if (!report) {
        throw new Error(`Report does not exist: ${reportId}`)
      }

      const data = await buildReportData(report, res)

      return res.render('pages/reviewer/view-report', { data })
    },
  }
}
