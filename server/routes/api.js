const express = require('express')
const path = require('path')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { coordinatorOnly } = require('../middleware/roleCheck')

module.exports = function Index({ authenticationMiddleware, offenderService, reportingService, systemToken }) {
  const router = express.Router()

  router.use(authenticationMiddleware)

  const placeHolder = path.join(process.cwd(), '/assets/images/image-missing.png')

  router.get('/offender/:bookingId/image', async (req, res) => {
    const { bookingId } = req.params

    const token = await systemToken(req.user.username)

    await offenderService
      .getOffenderImage(token, bookingId)
      .then(data => {
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(() => {
        res.sendFile(placeHolder)
      })
  })

  router.get(
    '/reports/mostOftenInvolvedStaff/:year/:month',
    coordinatorOnly,
    asyncMiddleware(async (req, res) => {
      const { year, month } = req.params
      const agencyId = res.locals.user.activeCaseLoadId

      const results = await reportingService.getMostOftenInvolvedStaff(
        agencyId,
        parseInt(month, 10),
        parseInt(year, 10)
      )
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="involved-staff-${agencyId}-${month}-${year}.csv"`)
      res.send(results)
    })
  )

  router.get(
    '/reports/mostOftenInvolvedPrisoners/:year/:month',
    coordinatorOnly,
    asyncMiddleware(async (req, res) => {
      const { year, month } = req.params
      const agencyId = res.locals.user.activeCaseLoadId

      const results = await reportingService.getMostOftenInvolvedPrisoners(
        await systemToken(res.locals.user.username),
        agencyId,
        parseInt(month, 10),
        parseInt(year, 10)
      )
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="prisoners-${agencyId}-${month}-${year}.csv"`)
      res.send(results)
    })
  )

  router.get(
    '/reports/overview/:year/:month',
    coordinatorOnly,
    asyncMiddleware(async (req, res) => {
      const { year, month } = req.params
      const agencyId = res.locals.user.activeCaseLoadId

      const results = await reportingService.getIncidentsOverview(agencyId, parseInt(month, 10), parseInt(year, 10))
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="overview-${agencyId}-${month}-${year}.csv"`)
      res.send(results)
    })
  )

  router.get(
    '/reports/heatmap/:year/:month',
    coordinatorOnly,
    asyncMiddleware(async (req, res) => {
      const { year, month } = req.params
      const agencyId = res.locals.user.activeCaseLoadId

      const results = await reportingService.getIncidentHeatmap(
        await systemToken(res.locals.user.username),
        agencyId,
        parseInt(month, 10),
        parseInt(year, 10)
      )
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="heatmap-${agencyId}-${month}-${year}.csv"`)
      res.send(results)
    })
  )

  router.get(
    '/reports/incidentsByReligion/:year/:month',
    coordinatorOnly,
    asyncMiddleware(async (req, res) => {
      const { year, month } = req.params
      const agencyId = res.locals.user.activeCaseLoadId

      const results = await reportingService.getIncidentsByReligiousGroup(
        await systemToken(res.locals.user.username),
        agencyId,
        parseInt(month, 10),
        parseInt(year, 10)
      )
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="religion-${agencyId}-${month}-${year}.csv"`)
      res.send(results)
    })
  )

  router.get(
    '/reports/incidentsByEthnicGroup/:year/:month',
    coordinatorOnly,
    asyncMiddleware(async (req, res) => {
      const { year, month } = req.params
      const agencyId = res.locals.user.activeCaseLoadId

      const results = await reportingService.getIncidentsByEthnicGroup(
        await systemToken(res.locals.user.username),
        agencyId,
        parseInt(month, 10),
        parseInt(year, 10)
      )
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="ethnicity-${agencyId}-${month}-${year}.csv"`)
      res.send(results)
    })
  )
  router.get(
    '/reports/incidentsByAgeGroup/:year/:month',
    coordinatorOnly,
    asyncMiddleware(async (req, res) => {
      const { year, month } = req.params
      const agencyId = res.locals.user.activeCaseLoadId

      const results = await reportingService.getIncidentsByAgeGroup(
        await systemToken(res.locals.user.username),
        agencyId,
        parseInt(month, 10),
        parseInt(year, 10)
      )
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="age-${agencyId}-${month}-${year}.csv"`)
      res.send(results)
    })
  )
  return router
}
