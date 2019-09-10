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
    offenderName: namesByOffenderNumber[incident.offenderNo],
  })

  return {
    redirectToHomePage: async (req, res) => {
      res.redirect('/your-statements')
    },

    viewReportSent: async (req, res) => {
      res.render('pages/report-sent', { data: res.locals.formObject, reportId: req.params.reportId, links })
    },

    viewYourReports: async (req, res) => {
      const awaiting = await reportService.getReports(req.user.username, ReportStatus.IN_PROGRESS)
      const completed = await reportService.getReports(req.user.username, ReportStatus.SUBMITTED)

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

      const { id, form = {}, incidentDate, bookingId } = await reportService.getReport(req.user.username, reportId)

      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, bookingId)

      const { description: locationDescription = '' } = await offenderService.getLocation(
        res.locals.user.token,
        form.incidentDetails.locationId
      )

      const involvedStaff = await involvedStaffService.getInvolvedStaff(id)

      const involvedStaffNames = involvedStaff.map(staff => [`${properCaseFullName(staff.name)} - ${staff.userId}`])

      const data = reportSummary(form, offenderDetail, locationDescription, involvedStaffNames, incidentDate)

      return res.render('pages/your-report', { data, bookingId })
    },
  }
}
