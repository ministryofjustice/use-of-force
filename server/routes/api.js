const express = require('express')
const path = require('path')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { coordinatorOnly } = require('../middleware/roleCheck')

module.exports = function Index({
  authenticationMiddleware,
  offenderService,
  reportingService,
  reportService,
  systemToken,
}) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  const placeHolder = path.join(__dirname, '../assets/images/image-missing.png')

  router.get('/offender/:bookingId/image', async (req, res) => {
    const { bookingId } = req.params

    const token = (await reportService.isDraftInProgress(req.user.username, bookingId))
      ? await systemToken(req.user.username)
      : res.locals.user.token

    await offenderService
      .getOffenderImage(token, bookingId)
      .then(data => {
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(error => {
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

  return router
}
