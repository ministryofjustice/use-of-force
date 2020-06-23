const moment = require('moment')

module.exports = function CreateReviewRoutes({ offenderService, reportDetailBuilder, reviewService, systemToken }) {
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
    offenderNo: incident.offenderNo,
  })

  return {
    viewAllIncidents: async (req, res) => {
      const { awaiting, completed } = await reviewService.getReports(res.locals.user.activeCaseLoadId)

      const namesByOffenderNumber = await getOffenderNames(await systemToken(res.locals.user.username), [
        ...awaiting,
        ...completed,
      ])
      const awaitingReports = awaiting.map(toReport(namesByOffenderNumber))
      const completedReports = completed.map(toReport(namesByOffenderNumber))

      return res.render('pages/all-incidents', {
        awaitingReports,
        completedReports,
        selectedTab: 'all-incidents',
      })
    },

    reviewReport: async (req, res) => {
      const { reportId } = req.params

      const report = await reviewService.getReport(reportId)

      const data = await reportDetailBuilder.build(res.locals.user.username, report)

      return res.render('pages/reviewer/view-report', { data })
    },

    reviewStatements: async (req, res) => {
      const { reportId } = req.params

      const report = await reviewService.getReport(reportId)

      const { bookingId, reporterName, submittedDate } = report
      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
        bookingId
      )

      const statements = await reviewService.getStatements(await systemToken(res.locals.user.username), reportId)

      const data = { incidentId: reportId, reporterName, submittedDate, offenderDetail, statements }
      return res.render('pages/reviewer/view-statements', { data })
    },

    reviewStatement: async (req, res) => {
      const { statementId } = req.params

      const statement = await reviewService.getStatement(statementId)

      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
        statement.bookingId
      )
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
